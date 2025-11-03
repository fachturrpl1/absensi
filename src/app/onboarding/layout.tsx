export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Onboarding should NOT have sidebar/navbar
  return <>{children}</>;
}
