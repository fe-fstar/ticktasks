interface PasswordResetEmailProps {
  resetLink: string;
}

export function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
  return (
    <div className="grid place-items-center gap-4 text-center text-pretty">
      <h1 className="text-3xl lg:text-5xl">Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <p>
        <a href={resetLink}>Reset Password</a>
      </p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  );
}
