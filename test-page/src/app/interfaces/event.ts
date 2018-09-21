export interface Event {
  id: string;
  date: string;
  text: string;
  skillId: string;
  affectedPoints: number;
  affectedSkillName: string;
  affectedPointType: string;
  accountId: string;
  userUid: string;
  isPrivateRepo: boolean;
}
