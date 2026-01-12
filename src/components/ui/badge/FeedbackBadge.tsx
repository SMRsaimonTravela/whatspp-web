import React from "react";
import Badge from "../badge/Badge";
import type { IMessage } from "../../../types";

interface FeedbackBadgeProps {
  feedback?: IMessage["feedback"];
}

const FeedbackBadge: React.FC<FeedbackBadgeProps> = ({ feedback }) => {
  switch (feedback) {
    case "positive":
      return <Badge color="success" size="sm" startIcon={"👍"}>Positive</Badge>;
    case "negative":
      return <Badge color="error" size="sm" startIcon={"👎"}>Negative</Badge>;
    case "neutral":
      return <Badge color="info" size="sm" startIcon={"😐"}>Neutral</Badge>;
    case "resolve":
      return <Badge color="primary" size="sm" startIcon={"✔️"}>Resolved</Badge>;
    default:
      return <Badge color="light" size="sm">No feedback</Badge>;
  }
};

export default FeedbackBadge;

