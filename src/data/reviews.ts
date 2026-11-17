export interface RoomReview {
  name: string
  stayed: string
  rating: number
  text: string
}

export const REVIEWS_ARE_SAMPLES = true

export const REVIEWS: Record<string, RoomReview[]> = {
  single: [
    { name: 'Marian', stayed: 'October 2026', rating: 5, text: 'Small but spotless, and the price is hard to beat. The bed was comfortable and the Wi-Fi was fast enough for my work calls.' },
    { name: 'Paolo', stayed: 'September 2026', rating: 4, text: 'Good for a solo trip. The shared bathroom was always clean and the hot shower worked well.' },
    { name: 'Eli', stayed: 'August 2026', rating: 5, text: 'Exactly what I needed for a quiet work week. Desk, fan and a cold aircon at night.' },
    { name: 'Nina', stayed: 'August 2026', rating: 4, text: 'Tiny but tidy, and very close to the jeepney stop. Great for a short stay.' },
    { name: 'Carlo', stayed: 'July 2026', rating: 5, text: 'Cheapest decent room I found in Legazpi, and the owners were happy to store my bag after checkout.' }
  ],
  twin: [
    { name: 'Ana and Liza', stayed: 'November 2026', rating: 5, text: 'Two comfy beds, cold aircon and a short ride to the city center. The owners helped us book a tour to Cagsawa.' },
    { name: 'Jerome', stayed: 'October 2026', rating: 5, text: 'Quiet street and a very warm welcome. The private bathroom made a big difference.' },
    { name: 'Camille', stayed: 'August 2026', rating: 4, text: 'Great value for two friends. Wish the room had a bit more storage, but everything else was great.' }
  ],
  deluxe: [
    { name: 'Rico', stayed: 'November 2026', rating: 5, text: 'We could see Mayon from the room in the morning. Worth the extra for the view and the bigger bed.' },
    { name: 'Dana', stayed: 'October 2026', rating: 5, text: 'Beautiful wooden headboard, spotless room and a very helpful front desk.' },
    { name: 'Kuya Ben', stayed: 'October 2026', rating: 4, text: 'Comfortable bed and strong aircon. The street gets a little busy in the evening, but the room itself was quiet.' },
    { name: 'Sofia', stayed: 'September 2026', rating: 5, text: 'Perfect for our anniversary. They left a handwritten note and the sunrise view of Mayon was unforgettable.' },
    { name: 'Miguel and Trish', stayed: 'September 2026', rating: 5, text: 'Clean towels, hot shower and a lovely breakfast spot a few steps away. We would book this room again.' },
    { name: 'Hannah', stayed: 'August 2026', rating: 4, text: 'Spacious for the price. Check-in was smooth and the staff gave us a great food trip list for Legazpi.' },
    { name: 'Arvin', stayed: 'August 2026', rating: 5, text: 'Slept really well. The blackout curtains and thick walls made a big difference after a long day of hiking.' },
    { name: 'Pia', stayed: 'July 2026', rating: 5, text: 'The room felt new and smelled fresh. Easy to message the owners and they replied within minutes.' },
    { name: 'Gerald', stayed: 'July 2026', rating: 3, text: 'Nice room overall. The Wi-Fi was slow at night, but it was fine for browsing. Staff were kind about it.' }
  ],
  triple: [
    { name: 'The Reyes family', stayed: 'September 2026', rating: 4, text: 'Three single beds were perfect for us and our cousin. Plenty of space for our bags.' },
    { name: 'Marco', stayed: 'August 2026', rating: 5, text: 'The wood ceiling gives the room a cozy feel. Easy parking inside the gate.' }
  ],
  family: [
    { name: 'The Lim family', stayed: 'November 2026', rating: 5, text: 'Slept six of us comfortably. The kids loved the roof deck and we loved the shared kitchen.' },
    { name: 'Joy', stayed: 'October 2026', rating: 5, text: 'Best for groups. Clean, spacious and the Mayon view from the room was a bonus.' }
  ]
}
