import MemberList from "@/components/members/MemberList";

export function generateStaticParams() {
  return [{ teamId: "placeholder" }];
}

export default function MembersPage() {
  return <MemberList />;
}