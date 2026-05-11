import LoginPage from "@/legacy/pages/auth/Login";


type AuthLoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};


export default async function AuthLoginPage({ searchParams }: AuthLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <LoginPage nextPath={resolvedSearchParams?.next || "/workspace"} />;
}
