import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function wrapQueryBuilder(builder: any, onExecute: () => Promise<void>) {
  let executed = false;
  return new Proxy(builder, {
    get(target, prop) {
      const val = Reflect.get(target, prop);
      if (prop === 'then') {
        return (onfulfilled: any, onrejected: any) => {
          return target.then(async (response: any) => {
            if (!executed && !response.error) {
              executed = true;
              await onExecute();
            }
            return onfulfilled ? onfulfilled(response) : response;
          }, onrejected);
        };
      }
      if (typeof val === 'function') {
        return (...args: any[]) => {
          const res = val.apply(target, args);
          return wrapQueryBuilder(res, onExecute);
        };
      }
      return val;
    }
  });
}

import { cache } from "react";

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>, token?: string) => {
  const headersObj: Record<string, string> = {};
  // Chúng ta KHÔNG truyền token tùy chỉnh này trực tiếp vào headers của Supabase Client
  // bởi vì JWT của hệ thống được ký bằng JWT_SECRET riêng biệt của Next.js (trong file .env.local),
  // không khớp với JWT Secret của dự án Supabase Cloud. Việc truyền nó sẽ khiến Supabase
  // trả về lỗi "PGRST301 (Invalid/Expired JWT)" và chặn đứng tất cả các truy vấn (kể cả Đăng nhập).
  // Bảo mật của chúng ta được đảm bảo tuyệt đối ở tầng API Routes / Next.js Middleware.

  const client = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        headers: headersObj,
      }
    },
  );


  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'from') {
        return (relation: string) => {
          if (relation === 'nhatkyhethong') {
            return target.from(relation);
          }

          const queryBuilder = target.from(relation);

          const wrapMethod = (method: 'insert' | 'update' | 'delete'): any => {
            const original = queryBuilder[method] as any;
            return (...args: any[]) => {
              const result = original.apply(queryBuilder, args);
              
              return wrapQueryBuilder(result, async () => {
                try {
                  const headerStore = await headers();
                  const token = cookieStore.get("auth_access_token")?.value || 
                                headerStore.get("authorization")?.replace("Bearer ", "");
                  if (token) {
                    const decoded = decodeJwt(token);
                    if (decoded && decoded.vaitro === "Admin") {
                      const diachiip = headerStore.get("x-forwarded-for")?.split(",")[0] || 
                                      headerStore.get("x-real-ip") || 
                                      "127.0.0.1";
                      
                      const tableNames: Record<string, string> = {
                        sinhvien: "sinh viên",
                        giangvien: "giảng viên",
                        monhoc: "môn học",
                        lop: "lớp học",
                        lichhoc: "lịch học",
                        phancong: "phân công giảng dạy",
                        phonghoc: "phòng học",
                        hocky: "học kỳ",
                        khoa: "khoa",
                        taikhoan: "tài khoản",
                        thongbao: "thông báo",
                      };

                      const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "+07:00");
                      const actionName = method === 'insert' ? 'Thêm mới' : method === 'update' ? 'Cập nhật' : 'Xóa';
                      const label = tableNames[relation] || relation;
                      
                      // Trích xuất mã khóa chính nếu có
                      let makhoachinh: string | null = null;
                      if (args[0]) {
                        const item = Array.isArray(args[0]) ? args[0][0] : args[0];
                        if (item) {
                          makhoachinh = String(
                            item.masv || item.magv || item.mamon || item.malop || 
                            item.maphancong || item.maphong || item.mahk || 
                            item.makhoa || item.mataikhoan || item.mathongbao || ""
                          ) || null;
                        }
                      }

                      await target.from("nhatkyhethong").insert({
                        mataikhoan: decoded.mataikhoan,
                        hanhdong: `Admin: ${actionName} ${label}`,
                        tentable: relation,
                        makhoachinh,
                        giatricu: null,
                        giatrimoi: args[0] || null,
                        diachiip,
                        ngaytao: vnNow
                      });
                    }
                  }
                } catch (e) {
                  console.error("Lỗi khi tự động ghi log Admin CRUD:", e);
                }
              });
            };
          };

          return new Proxy(queryBuilder, {
            get(qbTarget, qbProp) {
              if (qbProp === 'insert' || qbProp === 'update' || qbProp === 'delete') {
                return wrapMethod(qbProp);
              }
              const val = Reflect.get(qbTarget, qbProp);
              if (typeof val === 'function') {
                return (...args: any[]) => {
                  const res = val.apply(qbTarget, args);
                  return res;
                };
              }
              return val;
            }
          });
        };
      }
      return Reflect.get(target, prop);
    }
  });
};

export const getSupabaseClient = cache(async () => {
  const cookieStore = await cookies();
  let token: string | undefined;
  try {
    const headerStore = await headers();
    token = cookieStore.get("auth_access_token")?.value || 
            headerStore.get("authorization")?.replace("Bearer ", "");
  } catch {
    // Thao tác ngoài ngữ cảnh HTTP request hoặc trong quá trình build static
  }
  return createClient(cookieStore, token);
});