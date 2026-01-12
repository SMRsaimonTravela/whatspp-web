import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import LoginForm from "../../components/auth/LoginForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Travela Host AI"
        description="Sign in to your Travela Host AI WhatsApp dashboard"
      />
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </>
  );
}
