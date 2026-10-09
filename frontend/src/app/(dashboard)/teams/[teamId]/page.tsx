import TeamRedirect from "@/components/teams/TeamRedirect";

export function generateStaticParams() {
  return [{ teamId: "placeholder" }];
}

export default function TeamPage() {
  return <TeamRedirect />;
}