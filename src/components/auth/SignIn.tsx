"use client";

import { useState } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";

/** The sign-in form, or the forgot-password form in its place. */
export function SignIn() {
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");

  return forgot
    ? <ForgotPasswordForm initialEmail={email} onBack={() => setForgot(false)} />
    : <LoginForm email={email} onEmailChange={setEmail} onForgot={() => setForgot(true)} />;
}
