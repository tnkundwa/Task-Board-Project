import TaskBoardPage from "@/components/tasks/TaskBoardPage";

export function generateStaticParams() {
  return [{ teamId: "placeholder" }];
}

export default function TasksRoute() {
  return <TaskBoardPage />;
}