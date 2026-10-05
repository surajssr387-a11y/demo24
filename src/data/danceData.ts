export interface StudioInfo {
  name: string;
  brandKicker: string;
  brandMain: string;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  address: string;
  googleMapsUrl: string;
  googleReviewWriteUrl: string;
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
  phone: "8340158178",
  phoneDisplay: "8340158178",
  whatsappNumber: "918340158178",
  address: "2nd Floor, Metro Market, Kutchery Road, Ranchi - 834002, Jharkhand, India",
  googleMapsUrl: "https://maps.app.goo.gl/JdRffwFDdtRKHeY49",
  googleReviewWriteUrl: "https://search.google.com/local/writereview?placeid=ChIJfXb3OSvh9DkRT_kKzlzE-lE",
  instagramHandle: "@ramysdancestudio",
  instagramUrl: "https://instagram.com/ramysdancestudio",
  youtubeHandle: "@ramysdancestudio6278",
  youtubeUrl: "https://www.youtube.com/@ramysdancestudio6278",
  youtubeChannelId: "UCCXbnQCjM8I_hNBBag60mLw",
  hours: {
    weekdays: "Mon – Sat: 10:00 AM – 7:00 PM",
    sunday: "Sunday: 8:00 AM – 5:00 PM"
  },
  demoPriceText: "₹49",
  upiId: "8340158178@ybi",
  upiPayeeName: "RAM SINGH BABLU"
};
