import React from "react";

export const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
        <button className="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export const Button = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button className="btn" onClick={onClick}>
      {children}
    </button>
  );
};

export const Input = ({
  type,
  placeholder,
  id,
}: {
  type: string;
  placeholder: string;
  id: string;
}) => {
  return (
    <input className="input" type={type} placeholder={placeholder} id={id} />
  );
};
