import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

async function testQuery() {
    const payload_mataikhoan = 'sv2001'; // Assuming the user is a student
    const otherMataikhoan = 'gv2004'; // The user they clicked on

    console.log("Checking my convs...");
    const { data: myConvs, error: myConvsErr } = await supabase
        .from("thanhvientrochuyen")
        .select("macuoctrochuyen")
        .eq("mataikhoan", payload_mataikhoan);
    
    if (myConvsErr) console.error("myConvsErr", myConvsErr);
    console.log("myConvs:", myConvs);

    const myConvIds = (myConvs || []).map(r => r.macuoctrochuyen);
    if (myConvIds.length > 0) {
        console.log("Checking shared convs...");
        const { data: sharedConvs, error: sharedConvsErr } = await supabase
            .from("thanhvientrochuyen")
            .select("macuoctrochuyen")
            .eq("mataikhoan", otherMataikhoan)
            .in("macuoctrochuyen", myConvIds);
        
        if (sharedConvsErr) console.error("sharedConvsErr", sharedConvsErr);
        console.log("sharedConvs:", sharedConvs);

        if (sharedConvs && sharedConvs.length > 0) {
            console.log("Checking existing CaNhan conv...");
            const { data: existingConv, error: existingConvErr } = await supabase
                .from("cuoctrochuyen")
                .select("macuoctrochuyen, tieude, loai, ngaytao, nguoidaxoa")
                .in("macuoctrochuyen", sharedConvs.map(r => r.macuoctrochuyen))
                .eq("loai", "CaNhan")
                .single();
            if (existingConvErr) console.error("existingConvErr", existingConvErr);
            console.log("existingConv:", existingConv);
            
            if (existingConv) {
                console.log("Already exists, return it.");
                return;
            }
        }
    }

    const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const vnNow = vnDate.toISOString().replace("T", " ").substring(0, 19);

    console.log("Creating new conv...");
    const { data: newConv, error: convErr } = await supabase
        .from("cuoctrochuyen")
        .insert({ loai: "CaNhan", tieude: null, ngaytao: vnNow, ngaycapnhat: vnNow })
        .select("macuoctrochuyen, tieude, loai, ngaytao")
        .single();
        
    if (convErr) {
        console.error("convErr", convErr);
        return;
    }
    console.log("newConv:", newConv);

    const membersToInsert = [
        { macuoctrochuyen: newConv.macuoctrochuyen, mataikhoan: payload_mataikhoan, vaitro: "member" },
        { macuoctrochuyen: newConv.macuoctrochuyen, mataikhoan: otherMataikhoan, vaitro: "member" },
    ];
    
    console.log("Inserting members...", membersToInsert);
    const { error: memberErr } = await supabase.from("thanhvientrochuyen").insert(membersToInsert);
    
    if (memberErr) {
        console.error("memberErr", memberErr);
    } else {
        console.log("Members inserted successfully");
    }
}

testQuery();
