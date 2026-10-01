export interface StudioInfo {
  name: string;
  brandKicker: string;
  brandMain: string;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  address: string;
  googleMapsUrl: string;
  instagramHandle: string;
  instagramUrl: string;
  youtubeHandle: string;
  youtubeUrl: string;
  youtubeChannelId: string;
  hours: {
    weekdays: string;
    sunday: string;
  };
  demoPriceText: string;
  upiId: string;
  upiPayeeName?: string;
}

export const studioInfo: StudioInfo = {
  name: "RAMY'S DANCE STUDIO",
  brandKicker: "RAMY'S",
  brandMain: "DANCE STUDIO",
  phone: "9692451182",
  phoneDisplay: "9692451182",
  whatsappNumber: "919692451182",
  address: "2nd Floor, Metro Market, Kutchery Road, Ranchi - 834002, Jharkhand, India",
  googleMapsUrl: "https://maps.google.com/?q=Metro+Market+Kutchery+Road+Ranchi+Jharkhand+834002",
  instagramHandle: "@ramysdancestudio",
  instagramUrl: "https://instagram.com/ramysdancestudio",
  youtubeHandle: "@ramysdancestudio6278",
  youtubeUrl: "https://www.youtube.com/@ramysdancestudio6278",
  youtubeChannelId: "UCCXbnQCjM8I_hNBBag60mLw",
  hours: {
    weekdays: "Mon – Sat: 10:00 AM – 7:00 PM",
    sunday: "Sunday: 8:00 AM – 5:00 PM"
  },
  demoPriceText: "₹99",
  upiId: "9692451182@fam",
  upiPayeeName: "sanjeev biruly"
};
