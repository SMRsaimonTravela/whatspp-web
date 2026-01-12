import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import RegisterForm from "../../components/auth/RegisterForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sign Up | WhatsApp AI Bot"
        description="Register for WhatsApp AI Bot"
      />
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </>
  );
}
