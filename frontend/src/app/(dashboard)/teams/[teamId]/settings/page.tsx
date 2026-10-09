import TeamSettingsContent from "@/components/teams/TeamSettingsContent";

export function generateStaticParams() {
  return [{ teamId: "placeholder" }];
}

export default function TeamSettingsPage() {
  return <TeamSettingsContent />;
}