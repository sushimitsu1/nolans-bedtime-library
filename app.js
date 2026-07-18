const stories = [
{
  id: 'ra-ratata',
  title: 'Ra the Ratata and the Rocky Road',
  category: 'Construction Vehicles',
  description: 'Ra uses his noisy breaker and teamwork to clear the road to a new playground.',
  keywords: ['ra','ratata','excavator','breaker','jackhammer','hydraulic','rock','road','construction','playground','teamwork'],
  cover: 'assets/books/ra-ratata/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/ra-ratata/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Ra was a little yellow excavator who worked at the Sunny Hill Construction Yard. Everyone called him Ra the Ratata.",
  "Ra did not have a digging bucket today. He had a long, strong breaker that went: “Ra-ta-ta-ta! Ra-ta-ta-ta!”",
  "One morning, Mo the Motor Grader rolled into the yard. “The road to the new playground is covered with big rocks!” said Mo.",
  "Ra lifted his breaker. “l can help!” he said. Ra and Mo drove toward the rocky road.",
  "Soon they found a giant gray rock sitting right in the middle of the road. “No one can get past,” said Mo.",
  "Ra moved slowly toward the rock. He planted his tracks firmly on the ground.",
  "Ra lowered his breaker. Then he began: “Ra-ta-ta-ta! Ra-ta-ta-ta!”",
  "The big rock cracked into three smaller rocks. “Great work, Ra!” cheered Mo.",
  "But the smaller rocks were still too heavy for Ra to move alone. “I need a little help,” Ra said.",
  "Lou the Loader scooped up the first rock. Dan the Dump Truck carried away the second.",
  "Ra broke the last rock into tiny pieces. “Ra-ta-ta-ta! Ra-ta-ta-ta!”",
  "Mo smoothed the road. Ro the Roller rolled it flat. Now the road was safe and smooth.",
  "The little vehicles drove down the finished road. They delivered swings, slides, and a bright red seesaw.",
  "“Thank you, Ra!” everyone cheered. Ra smiled. “We built it together.”",
  "That evening, Ra returned to the quiet construction yard. He rested his breaker, closed his sleepy eyes, and whispered: “Goodnight. Ra-ta-ta.”"
]
},
{
  id: 'po-police-pickup',
  title: 'Po the Police Pickup and the Lost Little Duck',
  category: 'Emergency Vehicles',
  description: 'Po and his emergency-vehicle friends help Pip the duckling find Mama Duck at Sunny Park.',
  keywords: ['po','police','pickup','truck','duck','duckling','pip','mama duck','park','ambulance','helicopter','rescue','teamwork','emergency'],
  cover: 'assets/books/po-police-pickup/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/po-police-pickup/page-${String(i+1).padStart(2,'0')}.webp`),
  narration: [
    "Po the Police Pickup began his morning patrol around Sunny Park. He liked helping everyone feel safe.",
    "Po drove slowly past the swings, the pond, and the flower garden. “Good morning!” he called.",
    "Near the park path, Po heard a tiny sound. “Peep! Peep! Peep!”",
    "A little yellow duckling stood alone beside a bench. “My name is Pip,” he sniffled. “I can’t find Mama.”",
    "“Don’t worry, Pip,” said Po gently. “We will find her together.”",
    "Po switched on his little flashing lights. He helped bicycles and scooters slow down safely.",
    "Amy the Ambulance arrived. She checked Pip and gave him a warm little blanket.",
    "Po looked near the playground. Amy searched beside the flower garden. But Mama Duck was not there.",
    "Then Po called Heli the Police Helicopter. “Can you look from high above?” he asked.",
    "Heli flew over the trees, the paths, and the sparkling pond. Soon he spotted a worried duck near the reeds.",
    "“I found Mama Duck!” called Heli. “She is waiting beside the pond!”",
    "Po carried Pip safely along the quiet park path. Amy and Heli followed nearby.",
    "“Pip!” quacked Mama Duck. “Mama!” peeped Pip. They hurried toward each other.",
    "“Thank you, Po,” said Mama Duck. Po smiled. “Everyone helped.”",
    "That evening, Po returned to the quiet police station. He dimmed his lights and whispered, ‘Goodnight, little duck.’"
  ]
},
{
  id: 'mo-motor-grader',
  title: 'Mo the Motor Grader and the Bumpy Road',
  category: 'Construction Vehicles',
  description: 'Mo and his road-crew friends smooth a bumpy country road so everyone can travel safely.',
  keywords: ['mo','motor grader','grader','bumpy road','road crew','roller','dump truck','apple grove','construction','teamwork'],
  cover: 'assets/books/mo-motor-grader/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/mo-motor-grader/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Mo the Motor Grader woke up early at the Sunny Hill Road Crew. He loved making roads smooth and safe.",
  "One morning, Dan the Dump Truck bounced down the lane. ‘The road to Apple Grove is full of bumps!’ he said.",
  "Mo rolled out to take a look. “Bump, bump, bump!” went the little delivery carts.",
  "‘We can fix it,’ said Mo kindly. He lowered his long blade.",
  "Mo scraped the high spots off the road. ‘Swish, scrape, swish!’ went the grader blade.",
  "But some loose dirt still covered the path. “We need a little help,” said Mo.",
  "Dan brought fresh gravel in his dump bed. “Here comes the road rock!” he cheered.",
  "Mo spread the gravel nice and flat. His blade made the road smoother and smoother.",
  "Then Ro the Roller rolled over the road. ‘Rumble, roll!’ Now the path felt almost ready.",
  "The little delivery carts rolled down the road again. ‘No more bump, bump, bump!’ they cheered.",
  "The road to Apple Grove felt smooth and safe. Everyone could travel easily now.",
  "Dan drove over the road with a happy grin. ‘This is the smoothest ride ever!’ he said.",
  "‘Thank you, Mo!’ said Dan and Ro. Mo smiled. ‘Teamwork makes roads better.’",
  "As the sun began to set, Mo looked at the smooth road. He felt proud of the helpful day.",
  "That night, Mo parked at the Sunny Hill yard. ‘Goodnight, smooth road,’ he whispered."
]
},
{
  id: 'dan-dump-truck',
  title: 'Dan the Dump Truck and the Busy Bridge',
  category: 'Construction Vehicles',
  description: 'Dan delivers gravel, beams, and one final load to help his friends finish a little bridge.',
  keywords: ['dan','dump truck','bridge','gravel','stones','crane truck','motor grader','roller','construction','teamwork'],
  cover: 'assets/books/dan-dump-truck/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/dan-dump-truck/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Dan the Dump Truck woke up early at the Sunny Hill Yard. He loved carrying big, helpful loads.",
  "One morning, Mo rolled over. “The little bridge at Pebble Creek needs fixing,” he said.",
  "Dan drove to the bridge with wood beams and gravel in his bed. His wheels rumbled happily down the road.",
  "‘I can help!’ said Dan. He carefully backed up to the busy bridge site.",
  "Dan dumped the gravel. ‘Rumble, tumble!’ went the load.",
  "Cora the Crane Truck lifted strong beams into place. Dan watched with a big smile.",
  "But one last pile of smooth stones was still missing. The bridge was not quite ready yet.",
  "Dan hurried back to the yard for one more careful load. ‘I’ll be right back!’ he said.",
  "Dan came back with the final load. “Here come the smooth stones!” he cheered.",
  "Dan tipped his bed very slowly. The smooth stones tumbled out right where they were needed.",
  "Mo spread the stones nice and even. Ro rolled them smooth and flat.",
  "Soon the little bridge was ready. The small cars rolled across with happy smiles.",
  "‘Thank you, Dan!’ said Mo and Ro. Dan beamed. ‘We built it together!’",
  "As the sun began to set, Dan looked at the strong little bridge. He felt proud of the helpful day.",
  "That night, Dan parked at the Sunny Hill Yard. ‘Goodnight, little bridge,’ he whispered."
]
},
{
  id: 'bella-bulldozer',
  title: 'Bella the Bulldozer and the Muddy Path',
  category: 'Construction Vehicles',
  description: 'Bella and her friends clear and strengthen a muddy woodland path for the animals.',
  keywords: ['bella','bulldozer','mud','muddy path','woodland','animals','dump truck','roller','construction','teamwork'],
  cover: 'assets/books/bella-bulldozer/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/bella-bulldozer/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "After the rain, the path in the woodland was very muddy. The animals could not walk through.",
  "Bella the Bulldozer saw the animals. “I will help!” she said.",
  "Bella pushed the heavy mud to the side. Push, push, push! The mud moved away.",
  "The path was starting to look better! ‘Thank you, Bella!’ said the animals.",
  "Dan the Dump Truck arrived with gravel. “Let’s make the path strong!”",
  "A road roller pressed the gravel flat. ‘Rumble, rumble, rumble!’",
  "The animals tried the path, It was perfect!",
  "The sun went down, and everyone felt happy. Bella loved helping her friends.",
  "The animals stepped carefully onto the new path. It felt firm beneath their feet.",
  "Bella pushed the last muddy pile away. Now the little path looked much cleaner.",
  "Dan the Dump Truck brought little stones. They helped make the path strong.",
  "Ro rolled the stones smooth and flat. Rumble, rumble went the roller.",
  "The animals tried the path. It was safe, smooth, and ready to use!",
  "“Thank you, Bella!” cheered the animals. Bella smiled. “We all helped together.”",
  "That night, Bella rested at the Sunny Hill Yard. “Goodnight, muddy path,” she whispered."
]
},
{
  id: 'grave-digger', title: 'Grave Digger and the Moonlight Mud Track', category: 'Monster Trucks',
  description: 'Grave Digger finds a safe path through a giant muddy puddle so the moonlight ride can begin.',
  keywords: ['grave digger','monster jam','monster truck','moonlight','mud','mud track','night ride','teamwork'],
  cover: 'assets/books/grave-digger/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/grave-digger/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Grave Digger loved the moonlight mud track. It was muddy, bumpy, and full of fun.",
  "One evening, Grave Digger rolled out under the bright moon. His green lights twinkled in the night.",
  "Soon he saw his friends waiting by the track. “Let’s take a moonlight ride!” they cheered.",
  "But the middle of the track was covered by a giant muddy puddle. Splash!",
  "‘We need a safe way through,’ said Grave Digger. He looked carefully at the mud.",
  "Slowly, he rolled into the squishy mud. Squish, squash went his giant tires.",
  "Grave Digger found a firm path around the deepest puddle. ‘Follow me!’ he called.",
  "One by one, the trucks followed Grave Digger. No one got stuck.",
  "‘Great job, Grave Digger!’ said the little crowd. The moonlight ride could begin.",
  "The finals were here! Grave Digger lined up at the starting line. The flag waved... VROOMMM! He ROCKED, he RUMBLED, he took off like a rocket!",
  "He flew over the first ramp—higher than the clouds! He spun in the air, did a big twirl, and landed with a muddy BOOM!",
  "Next came the mud pit. It was deep and slippery, but that didn’t stop Grave Digger! He splashed through like a champion! SPLASHHHH!",
  "Then came the moon jump! Grave Digger roared up the hill and launched as high as the moon! The crowd went WOOO!",
  "Grave Digger crossed the finish line first! He did one last spin for the fans and let out a happy GRRRAVE ROAR! He had done it! He won the race!",
  "The moon smiled down, the crowd cheered, and Grave Digger rolled back to the garage. He was tired, but very happy. Another awesome night of racing! Goodnight, Grave Digger. Sleep tight!"
]
},
{
  id: 'el-toro-loco', title: 'El Toro Loco and the Big Red Jump', category: 'Monster Trucks',
  description: 'El Toro Loco tackles the big red jump and helps repair the track so everyone can keep racing.',
  keywords: ['el toro loco','monster jam','monster truck','bull','red jump','ramp','race','teamwork'],
  cover: 'assets/books/el-toro-loco/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/el-toro-loco/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "El Toro Loco rolled into Red Canyon Arena. He smiled at the giant Big Red Jump.",
  "Tonight was Jump Night. El Toro Loco loved to race, spin, and soar.",
  "But near the ramp, he spotted a bumpy crack. “Oh no,” said El Toro Loco.",
  "‘We should fix it first,’ he said. ‘I want everyone to jump safely.’",
  "A little loader brought fresh dirt. A roller packed the track nice and smooth.",
  "‘Gracias, friends!’ cheered El Toro Loco. Soon the landing path looked strong again.",
  "El Toro Loco backed up to the start line. ‘Now I am ready,’ he said.",
  "Vroom! He raced up the Big Red Jump. Then he sailed through the air!",
  "Thump! El Toro Loco landed softly. ‘The track is perfect!’ everyone cheered.",
  "Soon the line moved again. One by one, the monster trucks took their turns.",
  "Now it was El Toro Loco’s turn. He rolled to the start line with a happy grin.",
  "Zoom! Up the big red ramp he raced. Then El Toro Loco flew high into the night sky.",
  "The crowd clapped and cheered. “Hooray for El Toro Loco!” shouted his friends.",
  "El Toro Loco smiled at his helpers. “We fixed the track together!” he said.",
  "That night, El Toro Loco rested quietly. “Goodnight, big red jump,” he whispered."
]
},
{
  id: 'monster-mutt', title: 'Monster Mutt and the Lost Bone Parade', category: 'Monster Trucks',
  description: 'Monster Mutt follows his nose and works with his friends to rescue the missing Bone Parade float.',
  keywords: ['monster mutt','monster jam','monster truck','dog','bone parade','lost bone','parade','teamwork'],
  cover: 'assets/books/monster-mutt/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/monster-mutt/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Monster Mutt loved the Sunny Town Bone Parade. Every year he led the way with a happy bark.",
  "He rolled to the parade path with a wag-wag smile. His doggy ears bounced in the breeze.",
  "But something was missing. The big parade bone was gone!",
  "‘Oh no!’ said Monster Mutt. ‘We need the bone for the parade.’",
  "He sniffed the air. Sniff, sniff! He smelled it near the park.",
  "Monster Mutt followed the smell down a twisty road. His friends rolled behind him.",
  "Soon he found the giant bone float by a muddy hill. It had rolled away and got stuck.",
  "‘We can pull it out together,’ said Monster Mutt. He tugged gently with a rope.",
  "Little by little, the bone float came free. ‘Hooray!’ barked Monster Mutt.",
  "Monster Mutt and his friends rolled the big bone float back to town. Everyone cheered, ‘You found it!’",
  "Then the Bone Parade began. Monster Mutt led the way with a happy bark-bark!",
  "Children waved and laughed. The shiny bone float made the whole town smile.",
  "At the end of the parade, Monster Mutt parked beside his friends. ‘We found it together!’ he said.",
  "‘Thank you, Monster Mutt!’ everyone cheered. Monster Mutt wagged his tail and grinned.",
  "That night Monster Mutt rolled home sleepy and proud. ‘Goodnight, Bone Parade,’ he whispered."
]
},
{
  id: 'megalodon', title: 'Megalodon and the Splashy Shortcut', category: 'Monster Trucks',
  description: 'Megalodon discovers loose bridge boards and helps repair the splashy shortcut before the beach parade.',
  keywords: ['megalodon','monster jam','monster truck','shark','beach','splash','shortcut','bridge','parade'],
  cover: 'assets/books/megalodon/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/megalodon/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Megalodon loved racing by the splashy seaside track. He was fast, friendly, and full of big watery smiles.",
  "One sunny day, Megalodon rolled to the beach with his monster-truck friends. They were ready for a fun parade by the water.",
  "Soon Megalodon saw a little bridge covered by a big puddle. No one knew if the shortcut road was safe.",
  "‘I can check the splashy shortcut!’ said Megalodon. He rolled forward with a brave grin.",
  "Splash! Megalodon rolled through the puddle. Water sparkled all around his giant tires.",
  "Under the puddle, Megalodon found some loose boards on the tiny bridge. ‘We should fix this first,’ he said.",
  "His friends brought planks, pebbles, and tools. Together they made the little bridge strong again.",
  "Then Megalodon tried the shortcut again. This time the bridge felt safe, smooth, and splashy-fun.",
  "‘Hooray for Megalodon!’ the trucks cheered. Now everyone could reach the beach parade on time.",
  "At the beach parade, Megalodon splashed past shells, flags, and smiling friends. Everyone waved and cheered for him.",
  "His monster-truck friends rolled beside him with the big beach banner. The parade was splashy, silly, and full of fun.",
  "When the parade was done, everyone thanked Megalodon. ‘You helped us get here safe and on time!’ they said.",
  "Megalodon smiled as he rolled by the gentle waves. The ocean sparkled, and the sky turned soft gold and pink.",
  "Back at his cozy seaside garage, Megalodon washed off the mud and sand. He felt proud of his splashy day.",
  "That night, Megalodon closed his sleepy eyes and listened to the waves. ‘Goodnight, ocean,’ he whispered."
]
},
{
id: 'monster-mutt-dalmatian', title: 'Monster Mutt Dalmatian and the Firehouse Race', category: 'Monster Trucks',
description: 'Monster Mutt Dalmatian helps prepare the firehouse track, races safely, and stops to help a friend.',
keywords: ['monster mutt dalmatian','monster jam','monster truck','dalmatian','firehouse','race','fire truck','teamwork'],
cover: 'assets/books/monster-mutt-dalmatian/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/monster-mutt-dalmatian/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Monster Mutt Dalmatian woke up at the firehouse with a waggy smile. Today was the Firehouse Race.",
  "He rolled past shiny red doors and friendly firefighters. Everyone waved and cheered.",
  "At the race track, bright cones and little ramps waited. But one hose bridge was still not ready.",
  "‘I can help!’ barked Monster Mutt Dalmatian. He hurried to the practice lane.",
  "He carried a bundle of soft race flags to the starting line. The track began to look ready.",
  "Then he helped move a light water barrel beside the hose bridge. Splash! It made everyone giggle.",
  "A little red fire cart brought the final safety cones. Monster Mutt Dalmatian lined them up carefully.",
  "Soon the firehouse track was ready. The crowd clapped as the race began.",
  "Monster Mutt Dalmatian zoomed over the hose bridge and around the cones. He felt fast, brave, and happy.",
  "He carried a bundle of soft race flags to the starting line. The track began to look ready.",
  "The Firehouse Race began with a happy cheer. Monster Mutt Dalmatian rolled off fast, safe, and steady.",
  "Next came the splash lane. Water sparkled as he drove through with a joyful whoosh!",
  "A little friend got stuck near the track. Monster Mutt Dalmatian stopped to help, and then they rolled on together.",
  "At the finish line, everyone clapped and barked. Monster Mutt Dalmatian won with teamwork and a big smile.",
  "That night, he rested at the cozy firehouse. ‘Goodnight, little champion,’ whispered the quiet garage."
]
},
{
id: 'zombie-sleepy-stadium', title: 'Zombie and the Sleepy Stadium', category: 'Monster Trucks',
description: 'Zombie and his friends prepare the quiet stadium for a gentle nighttime roll under the stars.',
keywords: ['zombie','monster truck','sleepy stadium','stadium','nighttime','flags','little fans','teamwork','bedtime'],
cover: 'assets/books/zombie-sleepy-stadium/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/zombie-sleepy-stadium/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Zombie the monster truck loved the little stadium. Every evening, he took one gentle lap before bed.",
  "Tonight the big stadium felt quiet and calm. Zombie was getting ready for the Sleepy Stadium Roll.",
  "“Ready, Zombie?” called Tilly the tow truck. Zombie gave a cheerful rumble-rumble.",
  "But near the first turn, Zombie saw some loose paper flags. They had blown onto the track after a breezy day.",
  "Zombie slowed down right away. “These flags could block someone’s view,” he said kindly.",
  "Tilly brought colorful flags to the track. Together, the friends made the stadium look cheerful and safe.",
  "Zombie and his friends worked side by side. Together, they clipped the flags into a neat line.",
  "The first slow lap began under the stars. Zombie rolled carefully, and the little fans clapped.",
  "Zombie tested the corner with a slow, safe roll. “It feels perfect now!” he said.",
  "At the next turn, a banner came loose in the breeze. Zombie stopped so everyone could help.",
  "Tilly held the banner steady while Zombie lifted it gently. Soon the sleepy stadium looked perfect again.",
  "Now the friends rolled side by side around the track. No one raced too fast, and everyone smiled.",
  "The little fans waved good night from the stands. Zombie gave a happy rumble and a gentle grin.",
  "The moon shone over the quiet stadium. The lights grew soft as the trucks parked together.",
  "Soon the stadium grew quiet and still. Zombie smiled good night and rolled home for a cozy sleep."
]
},
{
id: 'towie-stuck-little-van', title: 'Towie the Tow Truck and the Stuck Little Van', category: 'Construction Vehicles',
description: 'Towie makes a careful plan to help Willow out of the mud and bring her safely home.',
keywords: ['towie','tow truck','willow','little van','stuck','mud','cozy corner','rescue','construction','teamwork'],
cover: 'assets/books/towie-stuck-little-van/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/towie-stuck-little-van/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "One quiet evening, Towie rolled along the road through Cozy Corner. The sky was glowing gold, and the village felt calm and sleepy.",
  "Towie loved helping friends big and small. He always kept a kind eye on the road ahead.",
  "At the bend near Cozy Corner, Towie heard a tiny call. A little van named Willow was stuck in the mud.",
  "Willow’s wheels slipped and spun in the squishy patch. ‘Don’t worry,’ said Towie. ‘I can help you.’",
  "Towie backed up carefully and got his tow hook ready. He made sure everything was safe and snug.",
  "Willow took a deep breath and waited very still. Towie gave a gentle tug to start the rescue.",
  "Slowly, slowly, the mud began to loosen. Willow wiggled this way and that.",
  "The muddy patch let go a little more. ‘That’s it!’ cheered Towie with a happy smile.",
  "With one careful pull, Willow rolled free. ‘Thank you, Towie!’ she said with a happy beep.",
  "With one careful pull, Willow rolled free at last. ‘Thank you, Towie!’ she cheered.",
  "Towie guided Willow to a dry, safe spot. The village friends clapped and smiled.",
  "At the little garage, Towie checked Willow’s wheels. ‘All safe and sound!’ he said.",
  "Willow drove slowly beside Towie through Willow Vale. The sky turned soft and golden.",
  "Back in the village square, everyone waved good night. Willow felt brave and happy again.",
  "‘Helping friends is the best part of the day,’ said Towie. Then he rolled home for a cozy sleep."
]
},
{
id: 'cranky-wobbly-sign', title: 'Cranky the Crane Truck and the Wobbly Sign', category: 'Construction Vehicles',
description: 'Cranky and his friends work carefully together to make the bakery sign straight and steady again.',
keywords: ['cranky','crane truck','wobbly sign','bright meadow','bakery','bella','construction','repair','teamwork'],
cover: 'assets/books/cranky-wobbly-sign/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/cranky-wobbly-sign/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Cranky the Crane Truck loved helping his town friends every day.",
  "One morning, he noticed the bakery’s big sign wobbling in the wind.",
  "Cranky rolled over to take a careful look. The bakery sign wobbled this way and that.",
  "Cranky smiled. “Don’t worry, Bella. I’ll fix it nice and tall!”",
  "He parked carefully and set his boom up high.",
  "Cranky lifted the sign with a strong and steady hug.",
  "He straightened it and checked every bolt and screw.",
  "The sign was strong and steady now! “Thank you, Cranky!” cheered Bella.",
  "Cranky waved. “Anytime! That’s what friends are for.”",
  "Slowly and carefully, Cranky set the sign in just the right place. “It looks straight and steady now!” said Bella.",
  "Bella tightened the last little bolts while Cranky held the sign still. Soon the wobbly sign was safe and strong again.",
  "The neighbors smiled when they saw the bakery sign standing tall. “Hooray for Cranky!” they cheered.",
  "The sign stood straight and steady at last. Everyone cheered, and Bella brought out a sweet surprise.",
  "As the sky turned golden, the bakery sign glowed in the evening light. Cranky and his friends waved goodnight to Bright Meadow.",
  "Cranky felt proud of the safe, steady sign. Then the sleepy crane truck rolled off for a cozy night’s rest."
]
},
{
id: 'lila-rooftop-balloon', title: 'Lila the Ladder Truck and the Rooftop Balloon', category: 'Emergency Vehicles',
description: 'Lila raises her ladder slowly and safely to rescue a little red balloon from the bakery roof.',
keywords: ['lila','ladder truck','fire truck','rooftop balloon','red balloon','sunnyville','bakery','rescue','emergency','teamwork'],
cover: 'assets/books/lila-rooftop-balloon/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/lila-rooftop-balloon/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Lila the red ladder truck loved helping in Sunny Town. She always watched for little jobs up high.",
  "One warm evening, the town bakery was getting ready for a tiny party. Bright balloons bobbed in the soft sunset breeze.",
  "Then Lila spotted a red balloon on the bakery roof. “We should help before the wind blows it away,” she said.",
  "The balloon landed on the bakery rooftop near the chimney. It wiggled in the breeze and would not come down.",
  "Lila carefully raised her ladder up, up, up. She moved slowly so the balloon would not pop.",
  "With a gentle nudge, the balloon floated into her waiting hook. ‘Got it!’ cheered Lila.",
  "Up went Lila’s ladder, click by click. Everyone watched quietly as she reached toward the rooftop.",
  "Then a little gust of wind pushed the balloon farther along the roof. “Almost,” whispered Lila, staying calm and careful.",
  "“Please keep the street clear,” Lila said to her friends. Then she stretched her ladder a little farther toward the balloon.",
  "The little girl held her balloon tight. “Thank you, Lila!” she said with a smile.",
  "Everyone clapped in Sunnyville Bakery square. Lila gave a happy little beep.",
  "The baker said, ‘Thank you, Lila.’ He shared a sweet treat with all the friends.",
  "Then Lila lowered her ladder, slow and steady. “Safe jobs are the very best jobs,” she said.",
  "Soon the moon rose over Sunnyville. Lila rolled home feeling proud and calm.",
  "At the fire station, Lila whispered, ‘Good night.’ Then the helpful ladder truck rested for bed."
]
},
{
id: 'chev-camaro', title: 'Chev the Camaro and the Sleepy Speedway', category: 'Race Cars',
description: 'Chev and his friends make the little speedway smooth and safe for a gentle moonlight roll before bed.',
keywords: ['chev','camaro','race car','race cars','speedway','moonlight','safe driving','teamwork','bedtime'],
cover: 'assets/books/chev-camaro/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/chev-camaro/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Tonight the sun was setting at Sleepy Speedway. Chev was ready for a calm evening cruise.",
  "Gentle lights glowed around the track. Chev smiled at his good friends.",
  "They had a special plan for the evening. Tonight was the Sleepy Speedway Parade.",
  "Soon a few little fans arrived to watch. They sat quietly and smiled.",
  "Chev slowed down right away. ‘Pebbles can make our wheels slip,’ he said gently.",
  "Tilly brought a little brush. Milo the road roller came to help smooth the track.",
  "Chev rolled slowly past the flags and lights. He felt proud of the glowing track.",
  "Soon a few little fans arrived to watch. They sat quietly and smiled.",
  "Chev checked the turn with a slow, safe roll. ‘It feels perfect now!’ he said.",
  "The little fans clapped as Chev rolled by. He gave a happy beep and smiled.",
  "Then Chev and his friends rolled side by side. Their sleepy parade made everyone feel cozy.",
  "At the finish line, the friends parked in a neat row. The speedway twinkled softly in the moonlight.",
  "One by one, the little fans waved good night. The sleepy speedway grew calm and quiet.",
  "One by one, the little fans waved good night. The sleepy speedway grew calm and quiet.",
  "‘Good teamwork made tonight special,’ Chev whispered. Then the bright yellow race car rolled home for a cozy sleep."
]
},
{
id: 'dragon-glowing-cave-trail', title: 'Dragon and the Glowing Cave Trail', category: 'Monster Trucks',
description: 'Dragon and his friends follow a glowing crystal trail, help one another, and find a peaceful cave.',
keywords: ['dragon','monster truck','glowing cave','crystals','blue thunder','earth shaker','trail','teamwork','bedtime'],
cover: 'assets/books/dragon-glowing-cave-trail/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/dragon-glowing-cave-trail/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Dragon loved exploring near the mountain trail. One evening, he spotted a soft blue glow by the cave.",
  "Blue Thunder rolled up with a curious smile. ‘Should we go see what is glowing?’ he asked.",
  "Earth Shaker rumbled over with his bright lights on. ‘I’ll come too,’ he said in a calm, steady voice.",
  "The three friends followed the glowing cave trail. Tiny blue stones sparkled beside the path.",
  "A family of little bats fluttered near the cave roof. Dragon slowed down so they would not be scared.",
  "Inside the cave, the glow came from shiny crystal rocks. They lit the trail like sleepy stars.",
  "Blue Thunder noticed a small pile of stones in the way. The friends worked together to clear a safe path.",
  "Soon they reached a quiet pool deep in the cave. The glowing crystals twinkled in the water.",
  "Dragon smiled at the peaceful shining trail. “This is a lovely place for a gentle night ride,” he said.",
  "Blue Thunder watched the crystal water shimmer. ‘It feels quiet and cozy in here,’ he whispered.",
  "Earth Shaker carefully moved one last little stone. The trail was smooth and safe for everyone now.",
  "Dragon, Blue Thunder, and Earth Shaker smiled together. They knew they had found a special place.",
  "Soon they turned around and followed the shining trail back. The cave felt calm and friendly all the way.",
  "Outside, the moon hung over the quiet mountains. “What a lovely adventure,” said Dragon.",
  "Then the friends rolled home under the sleepy stars. They felt cozy, peaceful, and ready for bed."
]
},
{
id: 'max-d-twisty-training-track', title: 'Max-D and the Twisty Training Track', category: 'Monster Trucks',
description: 'Max-D practices careful turns and helps his friends make the twisty training track safe and ready.',
keywords: ['max-d','max d','monster truck','twisty track','training track','practice','flags','turns','teamwork','bedtime'],
cover: 'assets/books/max-d-twisty-training-track/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/max-d-twisty-training-track/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "One quiet evening, Max-D rolled to the twisty training track. He was ready to practice slow and careful turns.",
  "The track curved left, then right, then round again. Little cones and flags showed Max-D where to go.",
  "‘l can do this one step at a time,’ said Max-D. He took the first bend with a steady smile.",
  "Max-D rumbled gently between the bright orange cones. He made each turn a little smoother than the last.",
  "At the next corner, a small practice flag tipped sideways in the breeze. Max-D stopped so the track would stay neat and safe.",
  "With a careful nudge, Max-D helped the flag stand tall again. Then he rolled on down the track.",
  "Soon a few little truck friends came to watch. They cheered quietly from beside the rail.",
  "Under the glowing lights, Max-D made his smoothest lap yet. Around the twisty turns he rolled with calm, proud care.",
  "The moon peeked over the hills as practice came to an end. Max-D felt happy and ready for one last gentle ride.",
  "Soon Max-D practiced one more careful turn. The little training track glowed softly all around.",
  "A checkered flag leaned sideways in the breeze. Max-D and his friends made it stand up straight again.",
  "Then the friends parked side by side to rest. They listened to the quiet sounds of the night.",
  "From the stands, the little fans waved good night. Max-D gave a happy rumble and a gentle smile.",
  "The stars twinkled over the twisty training track. Everyone felt proud of the smooth, careful practice.",
  "At last the sleepy track grew still and calm. Max-D rolled home ready for a cozy sleep."
]
},
{
id: 'eddie-buried-water-pipe', title: 'Eddie the Excavator and the Buried Water Pipe', category: 'Construction Vehicles',
description: 'Eddie discovers a leaking buried pipe and works carefully with Rory and the construction crew to fix it.',
keywords: ['eddie','excavator','buried water pipe','rory','repair truck','construction','leak','digging','teamwork','bedtime'],
cover: 'assets/books/eddie-buried-water-pipe/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/eddie-buried-water-pipe/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "This morning, Eddie saw a puddle by the work path. ‘That water should not be there,’ he said.",
  "Eddie listened very carefully. He heard a tiny gurgle under the ground.",
  "‘A buried water pipe might be leaking!’ Eddie knew he had to dig with care.",
  "Scoop by scoop, Eddie moved the dirt aside. Soon a blue pipe peeked out below.",
  "Oh dear! The pipe had a crack. Little drops splashed into the puddle.",
  "Eddie called Rory the Repair Truck. Rory rolled over with a cheerful beep.",
  "They set out cones and made the spot safe. Then they looked closely at the broken pipe.",
  "Eddie dug a little wider around the pipe. Now Rory had room to work.",
  "Rory brought a shiny new pipe piece. ‘We can fix it together!’ he said.",
  "Dan tipped his bed very slowly. The smooth stones tumbled out right where they were needed.",
  "Eddie held the space open, steady and wide. The broken pipe was fixed right inside.",
  "Then the dripping water finally stopped. ‘Hooray!’ cheered the friends at the site.",
  "Eddie gently tucked the earth back into place. Soon the ground looked neat and smooth again.",
  "The sun went down on the quiet work site. Everyone smiled at the safe little road.",
  "‘Good teamwork fixed the buried pipe,’ said Eddie. Then he rolled home for a cozy sleep."
]
},
{
id: 'freddy-smoky-campfire', title: 'Freddy the Fire Engine and the Smoky Campfire', category: 'Emergency Vehicles',
description: 'Freddy and his friends carefully cool a smoky campfire so Pinecone Park can settle down safely for the night.',
keywords: ['freddy','fire engine','fire truck','smoky campfire','pinecone park','camping','fire safety','emergency','teamwork','bedtime'],
cover: 'assets/books/freddy-smoky-campfire/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/freddy-smoky-campfire/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "At Pinecone Park, a campfire was still making smoky puffs. The sleepy campsite needed a little help.",
  "Freddy the Fire Engine saw the smoke. “I can help make it safe,” he said.",
  "Freddy rolled down the forest road. His lights glowed softly in the evening.",
  "At the campsite, Freddy saw dry leaves near the fire ring. “We should cool this campfire down,” he said.",
  "Ranger Robin came to help right away. Together, the friends made a careful plan.",
  "Freddy sprayed a gentle shower of water. The smoky puffs began to fade away.",
  "Ranger Robin moved the camping bucket and rake to the side. The campsite started to look neat and safe.",
  "Soon the campfire was out, and the stones felt cool. The forest smelled fresh and clean again.",
  "Fireflies twinkled as Freddy checked the quiet campsite. Everything was safe for a cozy night.",
  "Soon the smoke was gone, and the campfire was safe. Everyone thanked Freddy for helping so quickly.",
  "The campers poured water one more time. Then they covered the fire until it was cool.",
  "Freddy smiled as Pinecone Park grew calm again. The tall pine trees swayed softly in the night breeze.",
  "The little campers waved good night. They promised to always be careful with campfires.",
  "Freddy rolled slowly past the quiet tents and glowing lanterns. Pinecone Park felt peaceful and cozy once more.",
  "Under the stars, Freddy headed home with a happy heart. Helping friends stay safe made bedtime feel just right."
]
},
{
id: 'tess-quiet-night-drive', title: 'Tess the Tesla and the Quiet Night Drive', category: 'Race Cars',
description: 'Tess enjoys a peaceful evening drive and helps Ollie find his way home through the softly glowing town.',
keywords: ['tess','tesla','electric car','race cars','quiet night drive','ollie','lantern lane','charging','helping','bedtime'],
cover: 'assets/books/tess-quiet-night-drive/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/tess-quiet-night-drive/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "As the sky turned pink and purple, Tess got ready for a quiet night drive. She loved the peaceful roads and the twinkling lights.",
  "Tess rolled softly through Sunnyville. Her electric wheels were smooth and quiet.",
  "Near Moonbeam Park, Tess saw a little car named Ollie. ‘I cannot find Lantern Lane,’ he said.",
  "Tess smiled kindly. ‘You can drive with me,’ she said. ‘My lights will show the way.’",
  "The two friends drove slowly past the quiet shops. Warm windows glowed in the gentle night.",
  "At the top of Lantern Hill, Tess paused for a moment. The town below sparkled like tiny stars.",
  "Soon they reached Lantern Lane. Ollie gave a happy beep when he saw his house lights.",
  "‘Thank you, Tess!’ said Ollie. Tess felt warm and proud as she continued her gentle drive.",
  "Then Tess drove to the hilltop charger for a short rest. The moon rose high above the quiet town.",
  "After her short rest, Tess unplugged and rolled on. The quiet road curved gently beneath the stars.",
  "Tess drove past sleepy trees and tiny fireflies twinkling like stars. Everything was peaceful and still.",
  "From the hill, Tess looked down at the twinkling town. ‘Good night, everyone,’ she whispered.",
  "A little fog rolled in, but Tess’s bright lights helped her see. She drove slow and safe.",
  "Tess arrived home and rolled in for a cozy rest. ‘What a quiet, wonderful night,’ she said.",
  "Tess closed her headlights and dreamed of tomorrow’s adventures. Good night, little driver. Sleep tight!"
]
},
{
id: 'earth-shaker-wobbly-dirt-bridge', title: 'Earth Shaker and the Wobbly Dirt Bridge', category: 'Monster Trucks',
description: 'Earth Shaker helps two rabbits make a wobbly forest bridge strong, steady, and safe.',
keywords: ['earth shaker','monster truck','dirt bridge','forest','rabbits','clover meadow','teamwork','helping'],
cover: 'assets/books/earth-shaker-wobbly-dirt-bridge/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/earth-shaker-wobbly-dirt-bridge/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Earth Shaker rumbled along Sunny Forest Trail. He loved helping friends in the woods.",
  "By the creek, he saw a little dirt bridge wobble. Two rabbits waited on the path.",
  "The rabbits wanted to cross to Clover Meadow. ‘The bridge feels too shaky,’ they said.",
  "Earth Shaker looked very carefully. “I can help make it strong,” he said.",
  "First, he pressed the loose dirt flat with his big tires. Pat, pat, pat went the ground.",
  "Then he rolled small stones into the soft spots. The bridge started to feel steadier.",
  "Next, Earth Shaker nudged a sturdy log beside the edge. It helped hold the dirt in place.",
  "Earth Shaker tested the bridge one more time. Wobble, wobble... then it felt much better!",
  "The rabbits stepped onto the bridge very slowly. ‘It feels safe now!’ they cheered.",
  "The little rabbits hopped onto the bridge once more. This time it felt strong, steady, and safe.",
  "One by one, the rabbits crossed to the other side. Earth Shaker smiled as he watched them go.",
  "‘Thank you, Earth Shaker!’ the rabbits cheered. They brought him wildflowers from the meadow.",
  "As the sun began to set, Earth Shaker looked at the bridge. It was no longer wobbly at all.",
  "Earth Shaker rumbled slowly home through the quiet forest. The sky turned soft and golden above the trees.",
  "‘Helping friends feels wonderful,’ said Earth Shaker. Then he rested for the night beneath the twinkling stars."
]
},
{
id: 'son-uva-digger-moonlit-hill-climb', title: 'Son-uva Digger and the Moonlit Hill Climb', category: 'Monster Trucks',
description: 'Son-uva Digger takes a calm, careful climb up Moonbeam Hill beneath the silver moon.',
keywords: ['son-uva digger','monster truck','moonlit hill','moonbeam hill','hill climb','night','bravery','careful'],
cover: 'assets/books/son-uva-digger-moonlit-hill-climb/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/son-uva-digger-moonlit-hill-climb/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "One calm evening, Son-uva Digger rolled to Moonbeam Hill. He was ready for a careful hill climb.",
  "The hill looked tall beneath the silver moon. ‘Slow and steady,’ Son-uva Digger said.",
  "At the first bump, the loose dirt wiggled. Son-uva Digger kept his wheels straight.",
  "Higher and higher he climbed. The little lights below began to twinkle.",
  "A few pebbles rolled down the path. Son-uva Digger stayed calm and did not rush.",
  "His friends cheered from the bottom of the hill. ‘You can do it!’ they called.",
  "Son-uva Digger found a smooth line up the slope. Grip, grip, grip went his big tires.",
  "Near the top, the moon shone bright. Son-uva Digger felt brave and strong.",
  "At last, he reached the top of Moonbeam Hill. He smiled at the sparkling town below.",
  "Near the top, Son-uva Digger slowed down and took a careful breath. ‘Almost there,’ he whispered.",
  "At last he reached the hilltop. The moon shone bright above him.",
  "Below him, the little lights of the town twinkled softly.",
  "He looked at the moonlit path behind him. ‘I did it,’ he said happily.",
  "Then he rolled gently down the sleepy hill. The night air felt calm and cool.",
  "Back home, Son-uva Digger felt brave and proud. Good night, Moonbeam Hill."
]
},
{
id: 'benny-backhoe-little-garden-pond', title: 'Benny the Backhoe and the Little Garden Pond', category: 'Construction Vehicles',
description: 'Benny clears and shapes a muddy garden pond so the ducklings, frog, and flowers can enjoy it.',
keywords: ['benny','backhoe','garden pond','ducklings','frog','lily pads','construction','helping'],
cover: 'assets/books/benny-backhoe-little-garden-pond/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/benny-backhoe-little-garden-pond/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "One sunny morning, Benny saw a little garden pond. The water was muddy after the rain.",
  "The ducklings could not splash. The frog had nowhere to sit.",
  "‘I can help!’ said Benny. He scooped the heavy mud away.",
  "Then Benny used his backhoe arm. He shaped the pond nice and round.",
  "Benny placed smooth stones all around. The little pond looked tidy and strong.",
  "Fresh water shimmered in the sun. Pink lilies floated on top.",
  "The ducklings swam, and the frog found a lily pad.",
  "The flowers drank the pond water. The whole garden seemed to smile.",
  "‘What a lovely little pond,’ said Benny. Then he rested in the golden glow.",
  "Soon, little ducks came to visit the pond. They paddled in circles and gave happy quacks.",
  "Benny placed a few smooth stones by the side. Now the pond was easy to reach.",
  "The flowers leaned close to see the shining water. The little garden looked beautiful and new.",
  "As the sun began to set, the garden friends smiled. Everyone loved the little pond.",
  "Soon, fireflies twinkled over the quiet pond. Benny felt proud of his careful work.",
  "‘Good night, little pond,’ Benny whispered softly. Then he rolled home for a cozy sleep."
]
},
{
id: 'finn-fireboat-drifting-sailboat', title: 'Finn the Fireboat and the Drifting Sailboat', category: 'Emergency Vehicles',
description: 'Finn calmly guides a worried little sailboat away from the rocks and safely back to Seabreeze Harbor.',
keywords: ['finn','fireboat','sailboat','seabreeze harbor','harbor','rescue','emergency','helping'],
cover: 'assets/books/finn-fireboat-drifting-sailboat/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/finn-fireboat-drifting-sailboat/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Finn the Fireboat began his morning patrol in Seabreeze Harbor. He liked helping everyone feel safe.",
  "One breezy morning, Finn spotted a little sailboat. It was drifting away from the dock.",
  "The little sailboat looked worried. ‘Oh dear,’ it said. ‘I can't get back by myself.’",
  "Finn floated closer and smiled. ‘Don't worry. I will help you,’ he said.",
  "Finn gently led the sailboat away from the rocks. He kept his line nice and steady.",
  "The breeze puffed, and the water wobbled. But Finn stayed calm and careful.",
  "Soon they turned back toward Seabreeze Harbor. The little sailboat felt much better.",
  "At the dock, harbor friends waved and cheered. “Hooray for Finn!” they called.",
  "Finn smiled as the little sailboat came safely in. The warm sunset made the harbor glow.",
  "Slowly, Finn turned the little sailboat around. The dock lights began to glow ahead.",
  "The little sailboat smiled. “Thank you, Finn,” he said. “I'm glad you helped me find my way.”",
  "Together they glided back into Seabreeze Harbor. The water shimmered softly in the evening light.",
  "At the dock, harbor friends waved good night. Everyone felt safe and happy again.",
  "Finn made one last calm patrol past the lighthouse. Seabreeze Harbor was peaceful and still.",
  "Then Finn rested by the dock and watched the moon. Good night, Finn. Sleep tight!"
]
},
{
id: 'cody-cement-mixer-cracked-sidewalk', title: 'Cody the Cement Mixer and the Cracked Sidewalk', category: 'Construction Vehicles',
description: 'Cody repairs a cracked sidewalk on Maple Lane so all the neighborhood animals can travel safely.',
keywords: ['cody','cement mixer','cracked sidewalk','maple lane','construction','cement','animals','helping'],
cover: 'assets/books/cody-cement-mixer-cracked-sidewalk/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/cody-cement-mixer-cracked-sidewalk/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "One sunny morning, Cody the Cement Mixer rolled down Maple Lane. He noticed a sidewalk with a long, bumpy crack.",
  "A bunny, a duck, and a little squirrel had to tiptoe around it. “This sidewalk needs some help,” said Cody.",
  "‘I can fix it!’ said Cody with a smile. He parked beside the path and got ready to work.",
  "First, Cody helped clear the broken pieces away. Soon the sidewalk was clean and ready.",
  "Then Cody mixed fresh, smooth cement in his turning drum. Swish, swish, swish went the mixer.",
  "Cody carefully poured the cement into the cracked sidewalk. He filled the long crack from end to end.",
  "Next, he smoothed the cement so it looked flat and neat. The little animals watched quietly.",
  "The new sidewalk looked better already. “It is strong and smooth!” cheered the animals.",
  "But the cement still needed time to dry. Cody placed bright cones nearby and waited patiently.",
  "The fresh sidewalk dried nice and smooth. “Now Maple Lane is safe again!” said Cody.",
  "Neighbors came to see the new path. They walked, skipped, and smiled.",
  "Cody cleaned the last little mess. Maple Lane looked neat and bright.",
  "Everyone thanked Cody for helping. He felt proud of his careful work.",
  "As the sun went down, Cody rolled home. The new sidewalk glowed in the evening light.",
  "Cody rested with a happy yawn. He dreamed of helping again tomorrow."
]
},
{
id: 'amy-ambulance-sleepy-kitten', title: 'Amy the Ambulance and the Sleepy Kitten', category: 'Emergency Vehicles',
description: 'Amy gives a very sleepy kitten a calm ride home through a gentle evening shower.',
keywords: ['amy','ambulance','kitten','miso','willow lane','rain','cozy ride','helping','bedtime','emergency vehicle'],
cover: 'assets/books/amy-ambulance-sleepy-kitten/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/amy-ambulance-sleepy-kitten/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "One warm evening, Amy the Ambulance finished her gentle check around Willow Lane. Her amber lights glowed softly.",
  "Near the library garden, Amy heard a tiny yawn. A ginger kitten sat beneath a bench, blinking his sleepy green eyes.",
  "“I’m Miso,” the kitten murmured. “But I played too long, and now I’m too tired to walk home.”",
  "“I can help you get there safely,” said Amy. She checked the quiet road toward Miso’s little blue cottage.",
  "A cool breeze rustled the willow leaves. Plip, plip—two raindrops landed on Amy’s shiny hood.",
  "Amy opened her rear door and lowered the little ramp. Inside waited a soft lavender blanket.",
  "Miso padded up the ramp and curled onto the blanket. “This feels cozy,” he purred.",
  "Amy rolled slowly along the lantern path. The gentle rain made tiny silver circles in the puddles.",
  "At the duck pond, a fallen branch blocked the lane. Amy stopped with plenty of room to spare.",
  "Amy spotted a smooth path around the pond. “We can take the quiet way,” she said.",
  "Around the pond they went, past sleepy ducks and shining reeds. Miso’s purr became a soft little rumble.",
  "Soon the little blue cottage appeared beyond the willow trees. Its yellow porch light shone like a star.",
  "Miso’s mama hurried onto the porch. “You brought my sleepy kitten home,” she said with a grateful smile.",
  "Miso carried the lavender blanket to his basket by the window. “Thank you for the cozy ride, Amy.”",
  "That night, Amy rested beneath the quiet moon. In the blue cottage, Miso dreamed warm and snug. Goodnight, Amy, and goodnight, Miso."
]
},
{
id: 'heli-rescue-helicopter-mountain-picnic', title: 'Heli the Rescue Helicopter and the Mountain Picnic', category: 'Emergency Vehicles',
description: 'Heli carries a picnic basket over a blocked mountain trail and finds a calm path through the mist.',
keywords: ['heli','rescue helicopter','mountain picnic','piper','park ranger pickup','lookout meadow','goat','rabbit','waterfall','mist','emergency vehicle'],
cover: 'assets/books/heli-rescue-helicopter-mountain-picnic/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/heli-rescue-helicopter-mountain-picnic/page-${String(i+1).padStart(2,'0')}.webp`),
narration: [
  "Early one sunny morning, Heli the Rescue Helicopter woke at the Sunrise Valley rescue pad. His yellow body gleamed.",
  "Piper the Park Ranger Pickup rolled in with a picnic basket. “The meadow trail is blocked, and our mountain friends need help,” she said.",
  "Heli looked toward the high green meadow. “I can carry the picnic safely over the rocks,” he promised.",
  "First, Heli checked the breeze, his rotor, and the clear blue sky. Everything was ready for a gentle flight.",
  "Piper fastened the basket into Heli’s blue cargo sling. Heli lifted it smoothly above the soft grass.",
  "Up Heli flew above the pine forest. The little basket swayed as softly as a sleepy swing.",
  "Near the mountain, a ribbon of pearly mist drifted across Heli’s usual route. Heli slowed and hovered.",
  "Heli listened for the little waterfall beside Lookout Meadow. Splash and sparkle showed him a clearer way.",
  "Heli followed the waterfall around the misty ridge. Beyond the last pine tree, warm sunlight opened ahead.",
  "There was Lookout Meadow, bright with purple flowers. The little goat and rabbit waved from a clear landing spot.",
  "Heli lowered the basket onto the meadow together with one careful hover. The picnic arrived safe and snug.",
  "The goat opened the basket while the rabbit spread the coral picnic cloth. Sweet berries and tiny sandwiches were ready to share.",
  "Piper reached the meadow by the newly cleared trail. Everyone cheered for Heli’s calm and clever flight.",
  "As the sun turned peach and gold, Heli flew home above the quiet pines. Lookout Meadow glowed behind him.",
  "That night, Heli rested beneath a silver moon. “Goodnight, mountain friends,” he whispered, and closed his sleepy eyes."
]
}
];

stories.forEach(story=>{ if(!Array.isArray(story.narration)) story.narration=[]; });

const $ = id => document.getElementById(id);
let selectedCategory = 'all';
let activeStory = null;
let currentPage = 0; // -1 cover, 0-14 pages
let touchStartX = null;
let visibleStories = stories;
let libraryScrollY = 0;
let timerInterval = null;
const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let narrationUtterance = null;
let narrationActive = false;
let narrationPaused = false;
let readAlongEnabled = false;
let readAlongStoryId = null;
let narrationGeneration = 0;
let pageRenderGeneration = 0;
const storage = {
  favorites: 'nolan:favorites',
  fontSize: 'nolan:font-size',
  highContrast: 'nolan:high-contrast',
  timerMinutes: 'nolan:timer-minutes',
  timerEndsAt: 'nolan:timer-ends-at'
};

function readFavorites(){
  try {
    const saved = JSON.parse(localStorage.getItem(storage.favorites) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(id=>stories.some(story=>story.id===id)) : []);
  } catch { return new Set(); }
}

let favoriteIds = readFavorites();
let fontSize = localStorage.getItem(storage.fontSize)==='large' ? 'large' : 'normal';
let highContrast = localStorage.getItem(storage.highContrast)==='true';
let timerEndsAt = Number(localStorage.getItem(storage.timerEndsAt)) || 0;

function showView(view){
  if(view!=='reader') stopNarration({disableReadAlong:true});
  ['library','reader','finished'].forEach(name=>$(`${name}View`).classList.toggle('active', view===name));
  window.scrollTo(0,0);
}

function returnToLibrary(){
  showView('library');
  renderLibrary();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if($('libraryView').classList.contains('active')) window.scrollTo(0,libraryScrollY);
  }));
}

function getCurrentNarrationText(){
  if(!activeStory || currentPage<0 || !Array.isArray(activeStory.narration)) return '';
  const text=activeStory.narration[currentPage];
  return typeof text==='string' ? text.trim() : '';
}

function setNarrationState(state){
  $('narrationStatus').textContent=state;
}

function updateNarrationControls(){
  const hasText=Boolean(getCurrentNarrationText());
  $('readPageButton').disabled=!speechSupported || !hasText;
  $('pauseNarrationButton').disabled=!speechSupported || !hasText || !narrationActive;
  $('restartNarrationButton').disabled=!speechSupported || !hasText;
  $('stopNarrationButton').disabled=!speechSupported || (!narrationActive && !readAlongEnabled);
  $('narrationUnsupported').hidden=speechSupported;
  $('narrationUnavailable').hidden=!speechSupported || currentPage<0 || hasText;
}

function preferredNarrationVoice(){
  if(!speechSupported) return null;
  const englishVoices=window.speechSynthesis.getVoices().filter(voice=>/^en([-_]|$)/i.test(voice.lang));
  const naturalPattern=/natural|neural|aria|jenny|samantha|google us english/i;
  return englishVoices.find(voice=>voice.lang.toLowerCase()==='en-us' && naturalPattern.test(voice.name))
    || englishVoices.find(voice=>voice.lang.toLowerCase()==='en-us')
    || englishVoices[0]
    || null;
}

function stopNarration({disableReadAlong=false}={}){
  narrationGeneration++;
  if(disableReadAlong){
    readAlongEnabled=false;
    readAlongStoryId=null;
  }
  const hadNarration=narrationActive || narrationUtterance;
  narrationUtterance=null;
  narrationActive=false;
  narrationPaused=false;
  if(speechSupported && hadNarration) window.speechSynthesis.cancel();
  setNarrationState('Ready');
  updateNarrationControls();
}

function readCurrentPage({enableReadAlong=true}={}){
  if(enableReadAlong && activeStory){
    readAlongEnabled=true;
    readAlongStoryId=activeStory.id;
  }
  const text=getCurrentNarrationText();
  if(!speechSupported || !text){ updateNarrationControls(); return; }
  stopNarration();
  const generation=narrationGeneration;
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='en-US';
  utterance.rate=.85;
  utterance.pitch=1;
  utterance.volume=1;
  const voice=preferredNarrationVoice();
  if(voice) utterance.voice=voice;
  narrationUtterance=utterance;
  narrationActive=true;
  narrationPaused=false;
  utterance.onstart=()=>{ if(narrationGeneration===generation && narrationUtterance===utterance){ setNarrationState('Reading'); updateNarrationControls(); } };
  utterance.onpause=()=>{ if(narrationGeneration===generation && narrationUtterance===utterance){ narrationPaused=true; setNarrationState('Paused'); updateNarrationControls(); } };
  utterance.onresume=()=>{ if(narrationGeneration===generation && narrationUtterance===utterance){ narrationPaused=false; setNarrationState('Reading'); updateNarrationControls(); } };
  utterance.onend=()=>{ if(narrationGeneration===generation && narrationUtterance===utterance){ narrationUtterance=null; narrationActive=false; narrationPaused=false; setNarrationState('Ready'); updateNarrationControls(); } };
  utterance.onerror=()=>{ if(narrationGeneration===generation && narrationUtterance===utterance){ narrationUtterance=null; narrationActive=false; narrationPaused=false; setNarrationState('Ready'); updateNarrationControls(); } };
  setNarrationState('Reading');
  updateNarrationControls();
  window.speechSynthesis.speak(utterance);
}

function pauseOrResumeNarration(){
  if(!speechSupported || !narrationActive) return;
  if(narrationPaused){
    window.speechSynthesis.resume();
    narrationPaused=false;
    setNarrationState('Reading');
  } else {
    window.speechSynthesis.pause();
    narrationPaused=true;
    setNarrationState('Paused');
  }
  updateNarrationControls();
}

function restartCurrentPageNarration(){
  const storyId=activeStory?.id;
  const page=currentPage;
  if(!speechSupported || !getCurrentNarrationText()) return;
  stopNarration();
  setTimeout(()=>{ if(activeStory?.id===storyId && currentPage===page) readCurrentPage({enableReadAlong:false}); },0);
}

function isFavorite(story){ return favoriteIds.has(story.id); }
function saveFavorites(){ localStorage.setItem(storage.favorites,JSON.stringify([...favoriteIds])); }

function toggleFavorite(id){
  if(favoriteIds.has(id)) favoriteIds.delete(id); else favoriteIds.add(id);
  saveFavorites();
  renderLibrary();
}

function renderCategoryCounts(){
  const countFor = category => stories.filter(story=>story.category===category).length;
  [['Emergency Vehicles','emergencyCount'],['Construction Vehicles','constructionCount'],['Monster Trucks','monsterCount'],['Race Cars','raceCarsCount']].forEach(([category,id])=>{
    const count=countFor(category);
    $(id).textContent=`${count} ${count===1?'story':'stories'} available`;
  });
}

function renderLibrary(){
  const q = $('searchInput').value.trim().toLowerCase();
  visibleStories = stories.filter(story => {
    const categoryMatch = selectedCategory==='all' || (selectedCategory==='favorites' ? isFavorite(story) : story.category===selectedCategory);
    const haystack = [story.title,story.category,story.description,...story.keywords].join(' ').toLowerCase();
    return categoryMatch && (!q || haystack.includes(q));
  });
  $('storyGrid').innerHTML = visibleStories.map(story => `
    <article class="story-card">
      <div class="cover-wrap"><img src="${story.cover}" alt="Cover of ${story.title}"></div>
      <div class="story-info">
        <span class="story-category">${story.category}</span>
        <h3>${story.title}</h3><p>${story.description}</p>
        <div class="story-meta"><span>📖 ${story.pages.length} pages</span><span>🌙 About 5 min</span></div>
        <div class="card-actions">
          <button class="favorite-button" type="button" data-favorite="${story.id}" aria-pressed="${isFavorite(story)}">${isFavorite(story)?'★ Favorited':'☆ Favorite'}</button>
          <button class="read-button" type="button" data-story="${story.id}">${getProgressLabel(story)}</button>
        </div>
      </div>
    </article>`).join('');
  $('storyCount').textContent = `${visibleStories.length} ${visibleStories.length===1?'story':'stories'}`;
  $('emptyState').hidden = visibleStories.length>0;
  document.querySelectorAll('.read-button').forEach(button=>button.addEventListener('click',()=>openStory(button.dataset.story)));
  document.querySelectorAll('.favorite-button').forEach(button=>button.addEventListener('click',()=>toggleFavorite(button.dataset.favorite)));
  renderCategoryCounts();
}

function getProgressLabel(story){
  const saved = Number(localStorage.getItem(`progress:${story.id}`));
  return Number.isFinite(saved) && saved>=0 && saved<story.pages.length ? `Continue from page ${saved+1}` : 'Read tonight';
}

function openStory(id){
  stopNarration({disableReadAlong:true});
  const story = stories.find(item=>item.id===id);
  if(!story) return;
  if($('libraryView').classList.contains('active')) libraryScrollY=window.scrollY;
  activeStory = story;
  const saved = Number(localStorage.getItem(`progress:${id}`));
  currentPage = Number.isFinite(saved) && saved>=0 && saved<activeStory.pages.length ? saved : -1;
  $('readerTitle').textContent = activeStory.title;
  showView('reader');
  renderPage();
  setTimeout(()=>$('bookStage').focus(),100);
}

function renderPage({autoRead=false}={}){
  if(!activeStory) return;
  stopNarration();
  const renderGeneration=++pageRenderGeneration;
  const renderedStoryId=activeStory.id;
  const renderedPage=currentPage;
  const isCover=currentPage===-1;
  const src=isCover?activeStory.cover:activeStory.pages[currentPage];
  $('loadingIndicator').style.display='block';
  $('pageImage').style.opacity='.35';
  let renderSettled=false;
  const finishRender=()=>{
    if(renderSettled || renderGeneration!==pageRenderGeneration) return;
    renderSettled=true;
    $('loadingIndicator').style.display='none';
    $('pageImage').style.opacity='1';
    if(autoRead) setTimeout(()=>{
      if(
        renderGeneration===pageRenderGeneration
        && activeStory?.id===renderedStoryId
        && currentPage===renderedPage
        && readAlongEnabled
        && readAlongStoryId===renderedStoryId
      ) readCurrentPage({enableReadAlong:false});
    },0);
  };
  $('pageImage').onload=finishRender;
  $('pageImage').onerror=finishRender;
  $('pageImage').src=src;
  $('pageImage').alt=isCover?`Cover of ${activeStory.title}`:`${activeStory.title}, page ${currentPage+1}`;
  $('pageCounter').textContent=isCover?'Cover':`Page ${currentPage+1} of ${activeStory.pages.length}`;
  $('prevButton').disabled=isCover;
  $('prevOverlay').disabled=isCover;
  const atEnd=currentPage===activeStory.pages.length-1;
  $('nextButton').textContent=atEnd?'Finish ✓':'Next →';
  $('progressFill').style.width=`${isCover?0:((currentPage+1)/activeStory.pages.length)*100}%`;
  if(!isCover) localStorage.setItem(`progress:${activeStory.id}`,currentPage);
  updateNarrationControls();
  preloadNearby();
}

function nextPage(){
  if(!activeStory) return;
  if(currentPage<activeStory.pages.length-1){
    const autoRead=readAlongEnabled && readAlongStoryId===activeStory.id;
    currentPage++;
    renderPage({autoRead});
  }
  else { localStorage.removeItem(`progress:${activeStory.id}`); finishStorytime('story'); }
}

function prevPage(){ if(currentPage>-1){ currentPage--; renderPage(); } }

function preloadNearby(){
  [-1,1].forEach(delta=>{const page=currentPage+delta;if(page>=0&&page<activeStory.pages.length){const image=new Image();image.src=activeStory.pages[page];}});
}

function finishStorytime(reason){
  const finishedByTimer=reason==='timer';
  $('finishedTitle').textContent='Storytime is finished';
  $('finishedMessage').textContent=finishedByTimer
    ? 'The gentle timer is done. You can snuggle, say good night, or keep reading whenever you are ready.'
    : 'That was a lovely story. Thank you for sharing a cozy reading moment together.';
  $('readAgainButton').hidden=!activeStory;
  showView('finished');
}

function applyPreferences(){
  document.documentElement.dataset.fontSize=fontSize;
  document.documentElement.dataset.contrast=highContrast ? 'high' : 'normal';
  $('fontSizeSelect').value=fontSize;
  $('contrastToggle').checked=highContrast;
  $('timerSelect').value=localStorage.getItem(storage.timerMinutes) || '0';
}

function openSettings(){
  $('settingsPanel').hidden=false;
  applyPreferences();
  setTimeout(()=>$('closeSettingsButton').focus(),0);
}

function closeSettings(){
  $('settingsPanel').hidden=true;
  $('settingsButton').focus();
}

function formatTimer(milliseconds){
  const seconds=Math.max(0,Math.ceil(milliseconds/1000));
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}

function stopTimer(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval=null;
  timerEndsAt=0;
  localStorage.removeItem(storage.timerEndsAt);
  $('timerStatus').hidden=true;
}

function updateTimerStatus(){
  if(!timerEndsAt){ $('timerStatus').hidden=true; return; }
  const remaining=timerEndsAt-Date.now();
  if(remaining<=0){ stopTimer(); finishStorytime('timer'); return; }
  $('timerStatus').hidden=false;
  $('timerStatus').textContent=`Timer ${formatTimer(remaining)}`;
}

function startTimer(){
  const minutes=Number($('timerSelect').value);
  localStorage.setItem(storage.timerMinutes,String(minutes));
  stopTimer();
  if(!minutes) return;
  timerEndsAt=Date.now()+minutes*60*1000;
  localStorage.setItem(storage.timerEndsAt,String(timerEndsAt));
  updateTimerStatus();
  timerInterval=setInterval(updateTimerStatus,1000);
  closeSettings();
}

function restoreTimer(){
  if(!timerEndsAt) return;
  updateTimerStatus();
  if(timerEndsAt) timerInterval=setInterval(updateTimerStatus,1000);
}

function resetReadingProgress(){
  if(!window.confirm('Reset reading progress for every story on this device?')) return;
  for(let index=localStorage.length-1;index>=0;index--){
    const key=localStorage.key(index);
    if(key && key.startsWith('progress:')) localStorage.removeItem(key);
  }
  renderLibrary();
}

function resetPreferences(){
  if(!window.confirm('Reset favorites and bedtime settings on this device?')) return;
  stopTimer();
  [storage.favorites,storage.fontSize,storage.highContrast,storage.timerMinutes].forEach(key=>localStorage.removeItem(key));
  favoriteIds=new Set();
  fontSize='normal';
  highContrast=false;
  applyPreferences();
  renderLibrary();
}

$('searchInput').addEventListener('input',renderLibrary);
document.querySelectorAll('.category-tab').forEach(tab=>tab.addEventListener('click',()=>{
  selectedCategory=tab.dataset.category;
  document.querySelectorAll('.category-tab').forEach(item=>item.classList.toggle('selected',item===tab));
  $('resultsTitle').textContent=selectedCategory==='all'?'Available stories':selectedCategory==='favorites'?'Favorite stories':selectedCategory;
  renderLibrary();
}));
$('surpriseButton').addEventListener('click',()=>{
  const choices=visibleStories.length?visibleStories:stories;
  openStory(choices[Math.floor(Math.random()*choices.length)].id);
});
$('homeButton').addEventListener('click',()=>{ showView('library'); renderLibrary(); });
$('backButton').addEventListener('click',returnToLibrary);
$('restartButton').addEventListener('click',()=>{ currentPage=-1; renderPage(); });
$('nextButton').addEventListener('click',nextPage); $('nextOverlay').addEventListener('click',nextPage);
$('prevButton').addEventListener('click',prevPage); $('prevOverlay').addEventListener('click',prevPage);
$('readPageButton').addEventListener('click',()=>readCurrentPage());
$('pauseNarrationButton').addEventListener('click',pauseOrResumeNarration);
$('restartNarrationButton').addEventListener('click',restartCurrentPageNarration);
$('stopNarrationButton').addEventListener('click',()=>stopNarration({disableReadAlong:true}));
$('finishedLibraryButton').addEventListener('click',returnToLibrary);
$('readAgainButton').addEventListener('click',()=>{ if(activeStory) openStory(activeStory.id); });
$('settingsButton').addEventListener('click',openSettings);
$('closeSettingsButton').addEventListener('click',closeSettings);
document.querySelector('[data-close-settings]').addEventListener('click',closeSettings);
$('timerStatus').addEventListener('click',openSettings);
$('fontSizeSelect').addEventListener('change',event=>{ fontSize=event.target.value; localStorage.setItem(storage.fontSize,fontSize); applyPreferences(); });
$('contrastToggle').addEventListener('change',event=>{ highContrast=event.target.checked; localStorage.setItem(storage.highContrast,String(highContrast)); applyPreferences(); });
$('timerSelect').addEventListener('change',event=>localStorage.setItem(storage.timerMinutes,event.target.value));
$('startTimerButton').addEventListener('click',startTimer);
$('resetProgressButton').addEventListener('click',resetReadingProgress);
$('resetPreferencesButton').addEventListener('click',resetPreferences);
$('fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}});
document.addEventListener('keydown',event=>{
  if(!$('settingsPanel').hidden && event.key==='Escape'){ closeSettings(); return; }
  if(!$('readerView').classList.contains('active')) return;
  if(event.target.closest?.('.narration-panel') && event.key!=='Escape') return;
  if(['ArrowRight',' ','Enter'].includes(event.key)){ event.preventDefault(); nextPage(); }
  if(['ArrowLeft','Backspace'].includes(event.key)){ event.preventDefault(); prevPage(); }
  if(event.key==='Escape'&&!document.fullscreenElement) returnToLibrary();
});
$('bookStage').addEventListener('touchstart',event=>touchStartX=event.changedTouches[0].clientX,{passive:true});
$('bookStage').addEventListener('touchend',event=>{if(touchStartX===null)return;const distance=event.changedTouches[0].clientX-touchStartX;if(Math.abs(distance)>55)(distance<0?nextPage:prevPage)();touchStartX=null;},{passive:true});

applyPreferences();
renderLibrary();
restoreTimer();
updateNarrationControls();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
