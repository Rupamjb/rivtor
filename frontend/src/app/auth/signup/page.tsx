import SignupPage from "@/legacy/pages/auth/Signup";


type AuthSignupPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};


export default async function AuthSignupPage({ searchParams }: AuthSignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <SignupPage nextPath={resolvedSearchParams?.next || "/workspace"} />;
}
