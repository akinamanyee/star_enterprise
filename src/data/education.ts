export interface EducationTopic {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  source: string;
  iconLabel: string;
}

export const EDUCATION_TOPICS: EducationTopic[] = [
  {
    id: "liability",
    title: "裝修工程責任",
    subtitle: "業主須知的法律責任",
    body: "根據《建築物條例》，業主有責任確保裝修工程不涉及違例建築工程。聘用未經認可的承建商進行結構改動，業主可能面臨檢控及須承擔還原費用。選擇職安健星級企業，確保工程合規安全。",
    source: "《建築物條例》(第123章)",
    iconLabel: "法",
  },
  {
    id: "fall-arrest",
    title: "防墮安全設備",
    subtitle: "高空作業的生命保障",
    body: "根據《工廠及工業經營（安全管理）規例》，僱主必須為高空工作人員提供合適的防墮裝備，包括安全帶、安全網及護欄。星級企業均通過職安局審核，確保防墮設備符合標準。",
    source: "職業安全健康局指引",
    iconLabel: "安",
  },
  {
    id: "safety-courses",
    title: "高空工作安全課程",
    subtitle: "專業培訓保障質素",
    body: "從事棚架搭建、外牆維修等高空工作的工人，須完成職安局認可的「密閉空間核准工人安全訓練課程」及相關安全培訓。星級企業承諾定期安排員工接受持續培訓，保持專業水平。",
    source: "職業安全健康局培訓要求",
    iconLabel: "訓",
  },
  {
    id: "recertification",
    title: "兩年重新認證",
    subtitle: "持續監察確保標準",
    body: "職安健星級企業認可資格每兩年需重新審核。企業須持續符合安全管理制度、工地安全表現及員工培訓等要求，方可續期。此機制確保認可企業始終維持高水平的職安健標準。",
    source: "職安健星級企業計劃認可準則",
    iconLabel: "認",
  },
];
