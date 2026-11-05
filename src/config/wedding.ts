// All the wedding details live here. Change them in one place.

export const wedding = {
  // Names are shown in this order everywhere.
  partner1: { first: "Hansika", full: "Hansika Fernando" },
  partner2: { first: "Vinoj", full: "Vinoj Dilshan" },
  // Wedding day, Sri Lanka time (+05:30). The countdown counts to the Mass.
  dateISO: "2026-12-11T15:00:00+05:30",
  dateText: "Friday, December 11th, 2026",
  dateLong: "December 11th, 2026",
  dateShort: "11 . 12 . 2026",
  events: [
    {
      title: "Holy Mass",
      time: "3:00 PM",
      place: "St. Sebastian's Church",
      area: "Katuwapitiya",
      mapUrl: "https://maps.app.goo.gl/bjMKh1uo3yMMBKWJ7",
    },
    {
      title: "Reception",
      time: "7:00 PM",
      place: "Ranowell Hotel",
      area: "Negombo",
      mapUrl: "https://maps.app.goo.gl/4gND1qqd9NUKUDix8",
    },
  ],
  // Shown at the end of the RSVP card ("Rather call? Reach us on").
  contact: { phone: "077 822 2835", tel: "+94778222835", name: "Vinoj" },
  // Credit at the very bottom of the page. Set url to "" to show plain text.
  credit: { name: "Dineth", url: "https://www.linkedin.com/in/dineth9d/" },
  // Largest party size a guest can enter when they are not on the guest list.
  openLinkMaxSeats: 6,
} as const;

export const coupleNames = `${wedding.partner1.first} & ${wedding.partner2.first}`;
export const monogram = [wedding.partner1.first[0], wedding.partner2.first[0]] as const;
