// All the wedding details live here. Change them in one place.

export const wedding = {
  groom: { first: "Vinoj", full: "Vinoj Dilshan" },
  bride: { first: "Chathuni", full: "Chathuni Rajapaksha" },
  // Wedding day, Sri Lanka time (+05:30). The countdown counts to the Mass.
  dateISO: "2026-12-11T15:00:00+05:30",
  dateText: "Friday, December 11th, 2026",
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
  // Largest party size a guest can enter when they are not on the guest list.
  openLinkMaxSeats: 6,
} as const;

export const coupleNames = `${wedding.groom.first} & ${wedding.bride.first}`;
export const monogram = [wedding.groom.first[0], wedding.bride.first[0]] as const;
