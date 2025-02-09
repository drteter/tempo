interface GoalProgressProps {
  goalId: string;
  onProgressUpdate: (amount: number) => void;
}

export default function GoalProgress(_props: GoalProgressProps) {
  // Simple progress component - can be expanded later
  return (
    <div>
      {/* Progress UI here */}
    </div>
  );
} 