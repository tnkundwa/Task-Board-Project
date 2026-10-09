import TeamList from "@/components/teams/TeamList";

export const metadata = { title: "Teams — Task Board" };

export default function TeamsPage() {
  return (
    <div className="p-6">
      <TeamList />
    </div>
  );
}
