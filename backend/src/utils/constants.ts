import type { RequestStatus } from "../types";

export const REQUEST_STATUSES: RequestStatus[] = [
  "requested",
  "chatting",
  "accepted",
  "rejected",
  "confirmed",
  "active",
  "return_pending",
  "completed",
  "disputed",
  "cancelled",
];

export const CATEGORIES = [
  {
    key: "furniture",
    label: "Furniture",
    icon: "sofa",
    subcategories: [
      "Office chairs",
      "Study/work tables",
      "Sofas/recliners",
      "Beds/wardrobes",
    ],
  },
  {
    key: "cameras-creator-gear",
    label: "Cameras & Creator Gear",
    icon: "camera",
    subcategories: [
      "DSLR/mirrorless cameras",
      "Lenses",
      "Tripods",
      "Ring lights",
      "Gimbals",
      "Wireless mics",
    ],
  },
  {
    key: "electronics-gaming",
    label: "Electronics & Gaming",
    icon: "gamepad-2",
    subcategories: [
      "Projectors",
      "Gaming consoles",
      "Party speakers",
      "Monitors",
      "Printers",
    ],
  },
  {
    key: "home-appliances",
    label: "Home Appliances",
    icon: "refrigerator",
    subcategories: [
      "Air coolers",
      "Air purifiers",
      "Microwaves",
      "Vacuum cleaners",
      "Mini fridges",
    ],
  },
  {
    key: "tools-diy",
    label: "Tools & DIY",
    icon: "drill",
    subcategories: ["Drill machines", "Ladders", "Pressure washers", "Tool kits"],
  },
  {
    key: "events-outdoor",
    label: "Events & Outdoor",
    icon: "tent",
    subcategories: [
      "Projector screens",
      "Foldable tables/chairs",
      "Camping tents",
      "Large suitcases",
      "Trekking bags",
    ],
  },
];

export const USE_CASE_COLLECTIONS = [
  "Work From Home Setup",
  "Weekend Party",
  "Creator Kit",
  "Moving-In Essentials",
  "DIY Home Repair",
  "Gaming Weekend",
];

export const CITIES = [
  { city: "Bengaluru", localities: ["Indiranagar", "HSR Layout", "Koramangala"] },
  { city: "Mumbai", localities: ["Andheri", "Powai", "Bandra"] },
  { city: "Delhi", localities: ["Saket", "Dwarka", "Rohini"] },
  { city: "Pune", localities: ["Baner", "Kothrud", "Wakad"] },
];
