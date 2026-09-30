const MUSIC_STYLES = [
  {
    id: 'texas-blues',
    name: 'Texas Blues',
    icon: '🎸',
    description: 'Warm, singing tone, sustain สูง เหมาะกับ Pentatonic solo',
    artists: ['Stevie Ray Vaughan', 'Gary Moore', 'Rory Gallagher'],
    chainNote: null,
    chain: [
      {
        category: 'COMP', enabled: true, model: 'Yellow Comp',
        params: [
          { name: 'Sustain', value: 55 },
          { name: 'Level', value: 75 },
          { name: 'Attack', value: 35 },
        ]
      },
      {
        category: 'DRIVE', enabled: true, model: 'Ibanez',
        params: [
          { name: 'Drive', value: 40 },
          { name: 'Tone', value: 60 },
          { name: 'Level', value: 70 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Fender Deluxe Reverb',
        params: [
          { name: 'Gain', value: 55 },
          { name: 'Bass', value: 60 },
          { name: 'Mid', value: 65 },
          { name: 'Treble', value: 60 },
          { name: 'Presence', value: 55 },
          { name: 'Volume', value: 70 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Fender Deluxe Reverb',
        params: [
          { name: 'Mic', value: 40 },
          { name: 'Distance', value: 25 },
          { name: 'High Cut', value: 75 },
          { name: 'Low Cut', value: 15 },
        ]
      },
      {
        category: 'MOD', enabled: false, model: 'Classic Phaser',
        params: [
          { name: 'Rate', value: 30 },
          { name: 'Depth', value: 45 },
        ]
      },
      {
        category: 'DELAY', enabled: true, model: 'Analog Delay',
        params: [
          { name: 'Time', value: 450, unit: 'ms' },
          { name: 'Feedback', value: 25 },
          { name: 'Mix', value: 20 },
          { name: 'Tone', value: 55 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Spring Reverb',
        params: [
          { name: 'Decay', value: 35 },
          { name: 'Damp', value: 50 },
          { name: 'Mix', value: 25 },
        ]
      },
    ],
    tips: [
      'ปรับ Guitar Volume ลงที่ 6–7 เพื่อ clean tone ที่ยังมี body',
      'ใช้ Neck Pickup สำหรับ warm กว่า, Bridge สำหรับ bite',
      'เพิ่ม Drive อีกเล็กน้อยสำหรับ lead solo ที่ร้องหูมากขึ้น',
    ]
  },

  {
    id: 'chicago-blues',
    name: 'Chicago Blues',
    icon: '🎷',
    description: 'Clean, smooth tone compression สูง เหมาะกับ chord comping และ vibrato',
    artists: ['B.B. King', 'Buddy Guy', 'Muddy Waters'],
    chainNote: null,
    chain: [
      {
        category: 'COMP', enabled: true, model: 'Red Comp',
        params: [
          { name: 'Sustain', value: 70 },
          { name: 'Level', value: 65 },
          { name: 'Attack', value: 50 },
        ]
      },
      {
        category: 'DRIVE', enabled: false, model: 'Mooer Blues Mood',
        params: [
          { name: 'Drive', value: 30 },
          { name: 'Tone', value: 55 },
          { name: 'Level', value: 65 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Fender Twin Reverb',
        params: [
          { name: 'Gain', value: 35 },
          { name: 'Bass', value: 55 },
          { name: 'Mid', value: 60 },
          { name: 'Treble', value: 55 },
          { name: 'Presence', value: 50 },
          { name: 'Volume', value: 65 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Fender Twin Reverb',
        params: [
          { name: 'Mic', value: 45 },
          { name: 'Distance', value: 30 },
          { name: 'High Cut', value: 70 },
          { name: 'Low Cut', value: 20 },
        ]
      },
      {
        category: 'MOD', enabled: false, model: 'Classic Phaser',
        params: []
      },
      {
        category: 'DELAY', enabled: false, model: 'Analog Delay',
        params: [
          { name: 'Time', value: 350, unit: 'ms' },
          { name: 'Feedback', value: 20 },
          { name: 'Mix', value: 15 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Spring Reverb',
        params: [
          { name: 'Decay', value: 45 },
          { name: 'Damp', value: 55 },
          { name: 'Mix', value: 30 },
        ]
      },
    ],
    tips: [
      'BB King ใช้ vibrato มากแทน slide — ไม่จำเป็นต้องใช้ delay',
      'ตั้ง Tone ที่ Amp ให้ warm อย่าให้ bright เกิน',
      'ใช้ Semi-hollow body หรือ ES-335 จะได้เสียงใกล้เคียงที่สุด',
    ]
  },

  {
    id: 'classic-rock',
    name: 'Classic Rock',
    icon: '🤘',
    description: 'Crunchy, harmonic-rich tone balance ระหว่าง clean และ distortion',
    artists: ['Led Zeppelin', 'Deep Purple', 'Jimi Hendrix', 'Cream'],
    chainNote: null,
    chain: [
      {
        category: 'COMP', enabled: false, model: 'Yellow Comp',
        params: [{ name: 'Sustain', value: 45 }, { name: 'Level', value: 70 }]
      },
      {
        category: 'DRIVE', enabled: true, model: 'Fulltone OCD',
        params: [
          { name: 'Drive', value: 55 },
          { name: 'Tone', value: 60 },
          { name: 'Level', value: 70 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Marshall Plexi',
        params: [
          { name: 'Gain', value: 65 },
          { name: 'Bass', value: 60 },
          { name: 'Mid', value: 65 },
          { name: 'Treble', value: 65 },
          { name: 'Presence', value: 60 },
          { name: 'Volume', value: 70 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Marshall A',
        params: [
          { name: 'Mic', value: 50 },
          { name: 'Distance', value: 25 },
          { name: 'High Cut', value: 80 },
          { name: 'Low Cut', value: 10 },
        ]
      },
      {
        category: 'MOD', enabled: true, model: 'Classic Phaser',
        params: [
          { name: 'Rate', value: 30 },
          { name: 'Depth', value: 50 },
          { name: 'Mix', value: 35 },
        ]
      },
      {
        category: 'DELAY', enabled: true, model: 'Tape Echo',
        params: [
          { name: 'Time', value: 350, unit: 'ms' },
          { name: 'Feedback', value: 30 },
          { name: 'Mix', value: 25 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Room Reverb',
        params: [
          { name: 'Decay', value: 30 },
          { name: 'Damp', value: 50 },
          { name: 'Mix', value: 20 },
        ]
      },
    ],
    tips: [
      'สลับ Neck/Bridge pickup ระหว่าง solo เพื่อ dynamics ที่ดีขึ้น',
      'สำหรับ Hendrix — เพิ่ม WAH block และเปลี่ยน DRIVE เป็น Mooer Grey Faze (Fuzz)',
      'เล่นด้วย pick angle ต่างๆ เพื่อดึง harmonics ออกมา',
    ]
  },

  {
    id: 'hard-rock',
    name: 'Hard Rock',
    icon: '🔥',
    description: 'High gain, tight, กระชับ เหมาะกับ rhythm guitar ที่มีพลัง',
    artists: ["AC/DC", "Guns N' Roses", 'Van Halen', 'Whitesnake'],
    chainNote: null,
    chain: [
      {
        category: 'NOISE', enabled: true, model: 'Noise Gate',
        params: [
          { name: 'Threshold', value: 40 },
          { name: 'Decay', value: 35 },
        ]
      },
      {
        category: 'DRIVE', enabled: true, model: 'Mooer Pure Boost',
        params: [
          { name: 'Gain', value: 30 },
          { name: 'Level', value: 75 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Marshall JCM800',
        params: [
          { name: 'Gain', value: 70 },
          { name: 'Bass', value: 65 },
          { name: 'Mid', value: 55 },
          { name: 'Treble', value: 70 },
          { name: 'Presence', value: 65 },
          { name: 'Volume', value: 70 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Marshall A',
        params: [
          { name: 'Mic', value: 50 },
          { name: 'Distance', value: 20 },
          { name: 'High Cut', value: 80 },
          { name: 'Low Cut', value: 15 },
        ]
      },
      {
        category: 'MOD', enabled: false, model: 'Analog Chorus',
        params: []
      },
      {
        category: 'DELAY', enabled: true, model: 'Tape Echo',
        params: [
          { name: 'Time', value: 250, unit: 'ms' },
          { name: 'Feedback', value: 20 },
          { name: 'Mix', value: 15 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Room Reverb',
        params: [
          { name: 'Decay', value: 20 },
          { name: 'Mix', value: 15 },
        ]
      },
    ],
    tips: [
      'Pure Boost ก่อน AMP (Drive ต่ำ, Level สูง) ทำให้ distortion แน่น กระชับกว่า',
      'สำหรับ Van Halen — ลอง EVH AMP model แทน JCM800',
      'ใช้ Fixed bridge หรือ Floyd Rose สำหรับ tuning ที่ stable',
    ]
  },

  {
    id: 'modern-metal',
    name: 'Modern Metal',
    icon: '⚡',
    description: 'High gain สุด, tight bass, V-shape EQ เหมาะกับ down-tuned rhythm และ shred',
    artists: ['Metallica', 'Pantera', 'Lamb of God', 'Slayer'],
    chainNote: 'ย้าย NOISE block มาไว้หน้าสุดของ chain บนอุปกรณ์',
    chain: [
      {
        category: 'NOISE', enabled: true, model: 'Noise Gate',
        params: [
          { name: 'Threshold', value: 55 },
          { name: 'Decay', value: 30 },
        ]
      },
      {
        category: 'DRIVE', enabled: true, model: 'Metal Zone',
        params: [
          { name: 'Drive', value: 30 },
          { name: 'Tone', value: 50 },
          { name: 'Level', value: 80 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Mesa Boogie Triple Rectifier Distortion',
        params: [
          { name: 'Gain', value: 80 },
          { name: 'Bass', value: 70 },
          { name: 'Mid', value: 35 },
          { name: 'Treble', value: 70 },
          { name: 'Presence', value: 65 },
          { name: 'Master', value: 60 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Mesa Boogie C',
        params: [
          { name: 'Mic', value: 45 },
          { name: 'Distance', value: 20 },
          { name: 'High Cut', value: 85 },
          { name: 'Low Cut', value: 20 },
        ]
      },
      {
        category: 'EQ', enabled: true, model: 'Mooer GEQ (V-Shape)',
        params: [
          { name: '100Hz', value: 65 },
          { name: '250Hz', value: 40 },
          { name: '1kHz', value: 35 },
          { name: '4kHz', value: 60 },
          { name: '10kHz', value: 65 },
        ]
      },
      {
        category: 'DELAY', enabled: true, model: 'Digital Delay',
        params: [
          { name: 'Time', value: 180, unit: 'ms' },
          { name: 'Feedback', value: 15 },
          { name: 'Mix', value: 12 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Room Reverb',
        params: [
          { name: 'Decay', value: 15 },
          { name: 'Mix', value: 10 },
        ]
      },
    ],
    tips: [
      'Metal Zone ทำหน้าที่เป็น "Boost" ก่อน Amp (Drive ต่ำ ≤ 30, Level สูง) ทำให้ low end แน่น',
      'ลด Mid ที่ Amp แต่อย่าต่ำเกิน — เดี๋ยวเสียง "หาย" ในวง',
      'Down-tune เป็น Drop D หรือ Eb จะได้ความหนักที่ต้องการ',
    ]
  },

  {
    id: 'jazz',
    name: 'Jazz (Clean)',
    icon: '🎺',
    description: 'Warm, rounded clean tone ไม่มี harsh treble เหมาะกับ chord melody และ bebop',
    artists: ['Pat Metheny', 'Wes Montgomery', 'Jim Hall', 'George Benson'],
    chainNote: null,
    chain: [
      {
        category: 'COMP', enabled: true, model: 'Yellow Comp',
        params: [
          { name: 'Sustain', value: 75 },
          { name: 'Level', value: 65 },
          { name: 'Attack', value: 55 },
        ]
      },
      {
        category: 'DRIVE', enabled: false, model: 'Mooer Blues Mood',
        params: []
      },
      {
        category: 'AMP', enabled: true, model: 'Roland JC-120',
        params: [
          { name: 'Gain', value: 30 },
          { name: 'Bass', value: 60 },
          { name: 'Mid', value: 60 },
          { name: 'Treble', value: 45 },
          { name: 'Presence', value: 40 },
          { name: 'Volume', value: 65 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Roland JC',
        params: [
          { name: 'Mic', value: 45 },
          { name: 'Distance', value: 35 },
          { name: 'High Cut', value: 60 },
          { name: 'Low Cut', value: 25 },
        ]
      },
      {
        category: 'MOD', enabled: true, model: 'Analog Chorus',
        params: [
          { name: 'Rate', value: 20 },
          { name: 'Depth', value: 25 },
          { name: 'Mix', value: 25 },
        ]
      },
      {
        category: 'DELAY', enabled: false, model: 'Analog Delay',
        params: [
          { name: 'Time', value: 280, unit: 'ms' },
          { name: 'Feedback', value: 15 },
          { name: 'Mix', value: 12 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Hall Reverb',
        params: [
          { name: 'Decay', value: 50 },
          { name: 'Damp', value: 60 },
          { name: 'Mix', value: 25 },
        ]
      },
    ],
    tips: [
      'เล่น finger-style แทน pick จะได้ attack ที่นุ่มกว่า',
      'ลด Tone ที่กีต้าร์ลงที่ 6–7 เพื่อ warm โทนขึ้น',
      'Flatwound string ให้เสียง Jazz ที่ authentic ที่สุด',
    ]
  },

  {
    id: 'country',
    name: 'Country / Twang',
    icon: '🤠',
    description: 'Clean, bright, snappy พร้อม slapback delay และ tremolo',
    artists: ['Brad Paisley', 'Brent Mason', 'Chet Atkins', 'Albert Lee'],
    chainNote: null,
    chain: [
      {
        category: 'COMP', enabled: true, model: 'Deluxe Comp',
        params: [
          { name: 'Sustain', value: 65 },
          { name: 'Level', value: 70 },
          { name: 'Attack', value: 30 },
        ]
      },
      {
        category: 'DRIVE', enabled: true, model: 'Mooer Pure Boost',
        params: [
          { name: 'Gain', value: 25 },
          { name: 'Level', value: 75 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Fender Twin Reverb',
        params: [
          { name: 'Gain', value: 40 },
          { name: 'Bass', value: 50 },
          { name: 'Mid', value: 55 },
          { name: 'Treble', value: 68 },
          { name: 'Presence', value: 65 },
          { name: 'Volume', value: 65 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Fender Twin Reverb',
        params: [
          { name: 'Mic', value: 50 },
          { name: 'Distance', value: 25 },
          { name: 'High Cut', value: 85 },
          { name: 'Low Cut', value: 10 },
        ]
      },
      {
        category: 'MOD', enabled: true, model: 'Tremolo',
        params: [
          { name: 'Rate', value: 45 },
          { name: 'Depth', value: 40 },
        ]
      },
      {
        category: 'DELAY', enabled: true, model: 'Tape Echo',
        params: [
          { name: 'Time', value: 120, unit: 'ms' },
          { name: 'Feedback', value: 10 },
          { name: 'Mix', value: 30 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Spring Reverb',
        params: [
          { name: 'Decay', value: 30 },
          { name: 'Damp', value: 45 },
          { name: 'Mix', value: 20 },
        ]
      },
    ],
    tips: [
      'Slapback delay (80–120ms, Feedback 0) คือหัวใจของ Country tone',
      'ใช้ Bridge pickup บน Telecaster สำหรับ twang ที่ authentic',
      'Chicken-picking (ดีดสลับ pick กับนิ้ว) ให้เสียงเด้งและ snappy กว่า',
    ]
  },

  {
    id: 'funk',
    name: 'Funk',
    icon: '🕺',
    description: 'Rhythmic, percussive, clean tone พร้อม wah และ phaser',
    artists: ['John Frusciante', 'Nile Rodgers', 'Prince', 'Tom Morello'],
    chainNote: 'ย้าย WAH block มาไว้หน้าสุดของ chain บนอุปกรณ์',
    chain: [
      {
        category: 'WAH', enabled: true, model: 'Auto Wah',
        params: [
          { name: 'Sensitivity', value: 60 },
          { name: 'Range', value: 70 },
          { name: 'Attack', value: 40 },
          { name: 'Mix', value: 80 },
        ]
      },
      {
        category: 'COMP', enabled: true, model: 'Blue Comp',
        params: [
          { name: 'Sustain', value: 70 },
          { name: 'Level', value: 65 },
          { name: 'Attack', value: 40 },
        ]
      },
      {
        category: 'DRIVE', enabled: true, model: 'Mooer Pure Boost',
        params: [
          { name: 'Gain', value: 20 },
          { name: 'Level', value: 70 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Fender Deluxe Brownface',
        params: [
          { name: 'Gain', value: 35 },
          { name: 'Bass', value: 55 },
          { name: 'Mid', value: 55 },
          { name: 'Treble', value: 62 },
          { name: 'Volume', value: 65 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Fender Deluxe Reverb',
        params: [
          { name: 'Mic', value: 45 },
          { name: 'Distance', value: 25 },
          { name: 'High Cut', value: 80 },
          { name: 'Low Cut', value: 20 },
        ]
      },
      {
        category: 'MOD', enabled: true, model: 'Classic Phaser',
        params: [
          { name: 'Rate', value: 50 },
          { name: 'Depth', value: 40 },
          { name: 'Mix', value: 35 },
        ]
      },
      {
        category: 'DELAY', enabled: true, model: 'Digital Delay',
        params: [
          { name: 'Time', value: 150, unit: 'ms' },
          { name: 'Feedback', value: 10 },
          { name: 'Mix', value: 15 },
        ]
      },
      {
        category: 'REVERB', enabled: false, model: 'Room Reverb',
        params: [
          { name: 'Decay', value: 20 },
          { name: 'Mix', value: 15 },
        ]
      },
    ],
    tips: [
      'Funk rhythm เน้น muting — left-hand muting ให้จังหวะที่ percussive',
      'Auto Wah ตอบสนองต่อ picking strength ปรับ Sensitivity ให้เหมาะกับ touch ของคุณ',
      'ลอง GCB Wah แทน Auto Wah สำหรับ expressive control ที่มากกว่า',
    ]
  },

  {
    id: 'ambient',
    name: 'Ambient / Post-Rock',
    icon: '🌌',
    description: 'Expansive, atmospheric ด้วย reverb และ shimmer delay ที่ heavy',
    artists: ['Explosions in the Sky', 'Mogwai', 'Sigur Rós', 'The Album Leaf'],
    chainNote: null,
    chain: [
      {
        category: 'COMP', enabled: true, model: 'Deluxe Comp',
        params: [
          { name: 'Sustain', value: 60 },
          { name: 'Level', value: 70 },
        ]
      },
      {
        category: 'DRIVE', enabled: false, model: 'Mooer Pure Boost',
        params: [{ name: 'Gain', value: 20 }, { name: 'Level', value: 70 }]
      },
      {
        category: 'AMP', enabled: true, model: 'Matchless C30 Clean',
        params: [
          { name: 'Gain', value: 30 },
          { name: 'Bass', value: 55 },
          { name: 'Mid', value: 55 },
          { name: 'Treble', value: 60 },
          { name: 'Presence', value: 55 },
          { name: 'Volume', value: 65 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Matchless',
        params: [
          { name: 'Mic', value: 40 },
          { name: 'Distance', value: 30 },
          { name: 'High Cut', value: 70 },
          { name: 'Low Cut', value: 15 },
        ]
      },
      {
        category: 'MOD', enabled: true, model: 'Tri Chorus',
        params: [
          { name: 'Rate', value: 15 },
          { name: 'Depth', value: 55 },
          { name: 'Mix', value: 50 },
        ]
      },
      {
        category: 'DELAY', enabled: true, model: 'Ping Pong Delay',
        params: [
          { name: 'Time', value: 650, unit: 'ms' },
          { name: 'Feedback', value: 65 },
          { name: 'Mix', value: 45 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Shimmer Reverb',
        params: [
          { name: 'Decay', value: 80 },
          { name: 'Damp', value: 30 },
          { name: 'Mix', value: 55 },
        ]
      },
    ],
    tips: [
      'ลอง Slow Gear effect (Slow Gear Delay) แทน COMP เพื่อซ่อน pick attack',
      'E-Bow หรือ slide ให้ sustain ยาวพอที่จะ ride บน reverb ได้',
      'Shimmer Reverb + Ping Pong Delay Mix สูงๆ สร้าง soundscape ได้ดีมาก',
    ]
  },

  {
    id: 'pop-indie',
    name: 'Pop / Indie',
    icon: '✨',
    description: 'Balanced, versatile tone fit ทั้ง clean rhythm และ melodic lead',
    artists: ['Arctic Monkeys', 'The 1975', 'Radiohead', 'Tame Impala'],
    chainNote: null,
    chain: [
      {
        category: 'COMP', enabled: true, model: 'Blend Comp',
        params: [
          { name: 'Sustain', value: 55 },
          { name: 'Level', value: 70 },
          { name: 'Blend', value: 60 },
        ]
      },
      {
        category: 'DRIVE', enabled: true, model: 'Mooer Blues Mood',
        params: [
          { name: 'Drive', value: 30 },
          { name: 'Tone', value: 60 },
          { name: 'Level', value: 70 },
        ]
      },
      {
        category: 'AMP', enabled: true, model: 'Fender Blues Deluxe Clean',
        params: [
          { name: 'Gain', value: 40 },
          { name: 'Bass', value: 55 },
          { name: 'Mid', value: 60 },
          { name: 'Treble', value: 60 },
          { name: 'Presence', value: 55 },
          { name: 'Volume', value: 65 },
        ]
      },
      {
        category: 'CAB', enabled: true, model: 'Fender Blues Deluxe',
        params: [
          { name: 'Mic', value: 45 },
          { name: 'Distance', value: 25 },
          { name: 'High Cut', value: 78 },
          { name: 'Low Cut', value: 15 },
        ]
      },
      {
        category: 'MOD', enabled: true, model: 'Analog Chorus',
        params: [
          { name: 'Rate', value: 30 },
          { name: 'Depth', value: 35 },
          { name: 'Mix', value: 35 },
        ]
      },
      {
        category: 'DELAY', enabled: true, model: 'Digital Delay',
        params: [
          { name: 'Time', value: 320, unit: 'ms' },
          { name: 'Feedback', value: 30 },
          { name: 'Mix', value: 25 },
        ]
      },
      {
        category: 'REVERB', enabled: true, model: 'Room Reverb',
        params: [
          { name: 'Decay', value: 35 },
          { name: 'Damp', value: 50 },
          { name: 'Mix', value: 25 },
        ]
      },
    ],
    tips: [
      'ลอง sync delay กับ BPM เพลง (320ms ≈ quarter note @ 188 BPM)',
      'Chorus + clean amp เป็น foundation ของ indie guitar sound',
      'สำหรับ Radiohead — เพิ่ม MOD เป็น Ring Modulator หรือ Pitch Vibrato',
    ]
  },
];
