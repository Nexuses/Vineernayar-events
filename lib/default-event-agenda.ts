import type { EventAgendaItem } from "./event-agenda";

export type { EventAgendaItem };

export const DEFAULT_EVENT_AGENDA: EventAgendaItem[] = [
  {
    time: "02:00 PM - 03:00 PM",
    title: "Verification Gateway & Access Pass Validation",
    description:
      "Doors open for early check-in. Present your digital QR entry credentials at the venue.",
  },
  {
    time: "03:00 PM - 03:10 PM",
    title: "Opening Media Keynote: Humans First Screening",
    description:
      "An immersive video highlighting global workflow transformations and author philosophy values.",
  },
  {
    time: "03:10 PM - 03:20 PM",
    title: "Introduction Protocol: Launch Sequence Orientation",
    description:
      "A brief overview introducing modern economic operational metrics before panel discussions commence.",
  },
  {
    time: "03:20 PM - 04:00 PM",
    title: "Fireside Feature Spotlight: Conversational Deep-Dive",
    description:
      "Vineet Nayar interacts live with executive leaders analyzing enterprise value in automated economies.",
  },
  {
    time: "04:00 PM - 04:45 PM",
    title: "Open-Mic Collaborative Forum (Audience Q&A)",
    description:
      "Community problem-solving covering strategic questions selected from registration submissions.",
  },
  {
    time: "04:45 PM - 05:00 PM",
    title: "Interactive Display Signings & Press Matrix",
    description:
      "A collaborative documentation segment at the live interactive signature installation point.",
  },
  {
    time: "05:00 PM - 06:00 PM",
    title: "Executive Book Signing & Peer Networking Mixer",
    description:
      "Collect authorized book copies from Vineet Nayar while networking with peers from across industries.",
  },
];
