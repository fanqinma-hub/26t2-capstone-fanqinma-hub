import type { ImageSourcePropType } from 'react-native';

export type ClientAssetCategory =
  | 'vocabulary-card'
  | 'activity-scene'
  | 'scene-overlay'
  | 'learning-cover'
  | 'learning-illustration';

export type ClientAsset = Readonly<{
  source: ImageSourcePropType;
  label: string;
  category: ClientAssetCategory;
}>;

function clientAsset(source: ImageSourcePropType, label: string, category: ClientAssetCategory): ClientAsset {
  return { source, label, category };
}

export const clientSceneAssets = {
  activity01: clientAsset(
    require('../../assets/client/scenes/activity-01.png'),
    'Activity 1 client-provided scene',
    'activity-scene',
  ),
  activity02: clientAsset(
    require('../../assets/client/scenes/activity-02.png'),
    'Activity 2 client-provided scene',
    'activity-scene',
  ),
} as const satisfies Record<string, ClientAsset>;

// Keys describe only what is visibly confirmed in each client-provided image.
// They deliberately do not prescribe future Activity or domain-model usage.
export const clientIconAssets = {
  chair: clientAsset(require('../../assets/client/icons/icon-01.png'), 'Chair', 'vocabulary-card'),
  snake: clientAsset(require('../../assets/client/icons/icon-02.png'), 'Snake', 'vocabulary-card'),
  sun: clientAsset(require('../../assets/client/icons/icon-03.png'), 'Sun', 'vocabulary-card'),
  bedThreeDimensional: clientAsset(require('../../assets/client/icons/icon-04.png'), 'Bed', 'vocabulary-card'),
  bedIllustrated: clientAsset(require('../../assets/client/icons/icon-05.png'), 'Bed', 'vocabulary-card'),
  watermelon: clientAsset(require('../../assets/client/icons/icon-06.png'), 'Watermelon', 'vocabulary-card'),
  spaghetti: clientAsset(require('../../assets/client/icons/icon-07.png'), 'Spaghetti', 'vocabulary-card'),
  juice: clientAsset(require('../../assets/client/icons/icon-08.png'), 'Juice', 'vocabulary-card'),
  sofa: clientAsset(require('../../assets/client/icons/icon-09.png'), 'Sofa', 'vocabulary-card'),
  playing: clientAsset(require('../../assets/client/icons/icon-10.png'), 'Playing', 'vocabulary-card'),
  cat: clientAsset(require('../../assets/client/icons/icon-11.png'), 'Cat', 'vocabulary-card'),
  apple: clientAsset(require('../../assets/client/icons/icon-12.png'), 'Apple', 'vocabulary-card'),
  chef: clientAsset(require('../../assets/client/icons/icon-13.png'), 'Chef', 'vocabulary-card'),
  doctor: clientAsset(require('../../assets/client/icons/icon-14.png'), 'Doctor', 'vocabulary-card'),
  glass: clientAsset(require('../../assets/client/icons/icon-15.png'), 'Glass', 'vocabulary-card'),
  basketball: clientAsset(require('../../assets/client/icons/icon-16.png'), 'Ball', 'vocabulary-card'),
  beachBall: clientAsset(require('../../assets/client/icons/icon-17.png'), 'Ball', 'vocabulary-card'),
  phoneModern: clientAsset(require('../../assets/client/icons/icon-18.png'), 'Phone', 'vocabulary-card'),
  phoneClassic: clientAsset(require('../../assets/client/icons/icon-19.png'), 'Phone', 'vocabulary-card'),
  capOrange: clientAsset(require('../../assets/client/icons/icon-20.png'), 'Cap', 'vocabulary-card'),
  capGreen: clientAsset(require('../../assets/client/icons/icon-21.png'), 'Cap', 'vocabulary-card'),
  bagPink: clientAsset(require('../../assets/client/icons/icon-22.png'), 'Bag', 'vocabulary-card'),
  bagRed: clientAsset(require('../../assets/client/icons/icon-23.png'), 'Bag', 'vocabulary-card'),
  car: clientAsset(require('../../assets/client/icons/icon-24.png'), 'Car', 'vocabulary-card'),
  tree: clientAsset(require('../../assets/client/icons/icon-25.png'), 'Tree', 'vocabulary-card'),
  duck: clientAsset(require('../../assets/client/icons/icon-26.png'), 'Duck', 'vocabulary-card'),
  potato: clientAsset(require('../../assets/client/icons/icon-27.png'), 'Potato', 'vocabulary-card'),
  shoes: clientAsset(require('../../assets/client/icons/icon-28.png'), 'Shoes', 'vocabulary-card'),
  triangle: clientAsset(require('../../assets/client/icons/icon-29.png'), 'Triangle', 'vocabulary-card'),
  airplane: clientAsset(require('../../assets/client/icons/icon-30.png'), 'Airplane', 'vocabulary-card'),
  basket: clientAsset(require('../../assets/client/icons/icon-31.png'), 'Basket', 'vocabulary-card'),
  orange: clientAsset(require('../../assets/client/icons/icon-32.png'), 'Orange', 'vocabulary-card'),
  broccoli: clientAsset(require('../../assets/client/icons/icon-33.png'), 'Broccoli', 'vocabulary-card'),
  snowman: clientAsset(require('../../assets/client/icons/icon-34.png'), 'Snowman', 'vocabulary-card'),
  dog: clientAsset(require('../../assets/client/icons/icon-35.png'), 'Dog', 'vocabulary-card'),
  horse: clientAsset(require('../../assets/client/icons/icon-36.png'), 'Horse', 'vocabulary-card'),
  cycle: clientAsset(require('../../assets/client/icons/icon-37.png'), 'Cycle', 'vocabulary-card'),
  bananas: clientAsset(require('../../assets/client/icons/icon-38.png'), 'Bananas', 'vocabulary-card'),
  plate: clientAsset(require('../../assets/client/icons/icon-39.png'), 'Plate', 'vocabulary-card'),
  bread: clientAsset(require('../../assets/client/icons/icon-40.png'), 'Bread', 'vocabulary-card'),
  shoppingCart: clientAsset(require('../../assets/client/icons/icon-41.png'), 'Cart', 'vocabulary-card'),
  perfume: clientAsset(require('../../assets/client/icons/icon-42.png'), 'Perfume', 'vocabulary-card'),
  dressingTable: clientAsset(require('../../assets/client/icons/icon-43.png'), 'Dressing table', 'vocabulary-card'),
  window: clientAsset(require('../../assets/client/icons/icon-44.png'), 'Window', 'vocabulary-card'),
  door: clientAsset(require('../../assets/client/icons/icon-45.png'), 'Door', 'vocabulary-card'),
  toys: clientAsset(require('../../assets/client/icons/icon-46.png'), 'Toys', 'vocabulary-card'),
  television: clientAsset(require('../../assets/client/icons/icon-47.png'), 'Television', 'vocabulary-card'),
  fridge: clientAsset(require('../../assets/client/icons/icon-48.png'), 'Fridge', 'vocabulary-card'),
  pilot: clientAsset(require('../../assets/client/icons/icon-49.png'), 'Pilot', 'vocabulary-card'),
  stove: clientAsset(require('../../assets/client/icons/icon-50.png'), 'Stove', 'vocabulary-card'),
  eating: clientAsset(require('../../assets/client/icons/icon-51.png'), 'Eating', 'vocabulary-card'),
  sleeping: clientAsset(require('../../assets/client/icons/icon-52.png'), 'Sleeping', 'vocabulary-card'),
  driving: clientAsset(require('../../assets/client/icons/icon-53.png'), 'Driving', 'vocabulary-card'),
  blowingFire: clientAsset(require('../../assets/client/icons/icon-54.png'), 'Blowing fire', 'vocabulary-card'),
  studying: clientAsset(require('../../assets/client/icons/icon-55.png'), 'Studying', 'vocabulary-card'),
  thinking: clientAsset(require('../../assets/client/icons/icon-56.png'), 'Thinking', 'vocabulary-card'),
  rainbow: clientAsset(require('../../assets/client/icons/icon-57.png'), 'Rainbow', 'vocabulary-card'),
  clouds: clientAsset(require('../../assets/client/icons/icon-58.png'), 'Clouds', 'vocabulary-card'),
  painting: clientAsset(require('../../assets/client/icons/icon-59.png'), 'Painting', 'vocabulary-card'),
  birthdayParty: clientAsset(require('../../assets/client/icons/icon-60.png'), 'Birthday celebration', 'learning-illustration'),
  birthdayPartyMusicFocus: clientAsset(
    require('../../assets/client/icons/icon-61.png'),
    'Birthday celebration with music focus',
    'scene-overlay',
  ),
  playgroundSceneOne: clientAsset(require('../../assets/client/icons/icon-62.png'), 'Playground scene', 'activity-scene'),
  playgroundSceneTwo: clientAsset(require('../../assets/client/icons/icon-63.png'), 'Playground scene variant', 'activity-scene'),
  playgroundSceneDimmed: clientAsset(require('../../assets/client/icons/icon-64.png'), 'Dimmed playground scene', 'scene-overlay'),
  playgroundSceneSwingFocus: clientAsset(
    require('../../assets/client/icons/icon-65.png'),
    'Dimmed playground scene with swing focus',
    'scene-overlay',
  ),
  familyMeal: clientAsset(require('../../assets/client/icons/icon-66.png'), 'Family meal scene', 'learning-illustration'),
  presentation: clientAsset(require('../../assets/client/icons/icon-67.png'), 'Presentation scene', 'learning-illustration'),
  groupDiscussion: clientAsset(require('../../assets/client/icons/icon-68.png'), 'Group discussion scene', 'learning-illustration'),
  classroomTeaching: clientAsset(require('../../assets/client/icons/icon-69.png'), 'Classroom teaching scene', 'learning-illustration'),
  studentPresentation: clientAsset(require('../../assets/client/icons/icon-70.png'), 'Student presentation scene', 'learning-illustration'),
  deskConversation: clientAsset(require('../../assets/client/icons/icon-71.png'), 'Desk conversation scene', 'learning-illustration'),
  notebookGreen: clientAsset(require('../../assets/client/icons/icon-72.png'), 'Green notebook', 'vocabulary-card'),
  pen: clientAsset(require('../../assets/client/icons/icon-73.png'), 'Pen', 'vocabulary-card'),
  teacherAtChalkboard: clientAsset(require('../../assets/client/icons/icon-74.png'), 'Teacher at chalkboard', 'learning-illustration'),
  childSelectingBook: clientAsset(require('../../assets/client/icons/icon-75.png'), 'Child selecting a book', 'learning-illustration'),
  personOnParkBench: clientAsset(require('../../assets/client/icons/icon-76.png'), 'Person on park bench', 'learning-illustration'),
  childrenReading: clientAsset(require('../../assets/client/icons/icon-77.png'), 'Children reading', 'learning-illustration'),
  childrenPainting: clientAsset(require('../../assets/client/icons/icon-78.png'), 'Children painting', 'learning-illustration'),
  childrenAtChalkboard: clientAsset(require('../../assets/client/icons/icon-79.png'), 'Children at chalkboard', 'learning-illustration'),
  bucket: clientAsset(require('../../assets/client/icons/icon-80.png'), 'Bucket', 'vocabulary-card'),
  chiliSauce: clientAsset(require('../../assets/client/icons/icon-81.png'), 'Chili sauce', 'vocabulary-card'),
  fish: clientAsset(require('../../assets/client/icons/icon-82.png'), 'Fish', 'vocabulary-card'),
  notebookRed: clientAsset(require('../../assets/client/icons/icon-83.png'), 'Red notebook', 'vocabulary-card'),
  book: clientAsset(require('../../assets/client/icons/icon-84.png'), 'Book', 'vocabulary-card'),
  highlighter: clientAsset(require('../../assets/client/icons/icon-85.png'), 'Highlighter', 'vocabulary-card'),
  ribbon: clientAsset(require('../../assets/client/icons/icon-86.png'), 'Ribbon', 'vocabulary-card'),
  paperclip: clientAsset(require('../../assets/client/icons/icon-87.png'), 'Paperclip', 'vocabulary-card'),
  zooSceneOne: clientAsset(require('../../assets/client/icons/icon-88.png'), 'Zoo scene', 'activity-scene'),
  zooSceneTwo: clientAsset(require('../../assets/client/icons/icon-89.png'), 'Zoo scene variant', 'activity-scene'),
  zooSceneDimmed: clientAsset(require('../../assets/client/icons/icon-90.png'), 'Dimmed zoo scene', 'scene-overlay'),
  zooSceneLionGiraffeZebraFocus: clientAsset(
    require('../../assets/client/icons/icon-91.png'),
    'Dimmed zoo scene with lion, giraffe and zebra focus',
    'scene-overlay',
  ),
  zooSceneThree: clientAsset(require('../../assets/client/icons/icon-92.png'), 'Zoo scene with animal enclosures', 'activity-scene'),
  zooSceneDimmedRanger: clientAsset(require('../../assets/client/icons/icon-93.png'), 'Dimmed zoo scene with ranger focus', 'scene-overlay'),
  jungleAnimalScene: clientAsset(require('../../assets/client/icons/icon-94.png'), 'Jungle animal scene', 'activity-scene'),
  jungleSceneZebraFocus: clientAsset(require('../../assets/client/icons/icon-95.png'), 'Dimmed jungle scene with zebra focus', 'scene-overlay'),
  jungleSceneElephantFocus: clientAsset(require('../../assets/client/icons/icon-96.png'), 'Dimmed jungle scene with elephant focus', 'scene-overlay'),
  jungleSceneBananaFocus: clientAsset(require('../../assets/client/icons/icon-97.png'), 'Dimmed jungle scene with banana focus', 'scene-overlay'),
  jungleSceneMonkeyFocus: clientAsset(require('../../assets/client/icons/icon-98.png'), 'Dimmed jungle scene with monkey focus', 'scene-overlay'),
  jungleSceneSnakeFocus: clientAsset(require('../../assets/client/icons/icon-99.png'), 'Dimmed jungle scene with snake focus', 'scene-overlay'),
  jungleSceneTurtleFocus: clientAsset(require('../../assets/client/icons/icon-100.png'), 'Dimmed jungle scene with turtle focus', 'scene-overlay'),
  beachScene: clientAsset(require('../../assets/client/icons/icon-101.png'), 'Beach scene', 'activity-scene'),
  beachSceneShellFocus: clientAsset(require('../../assets/client/icons/icon-102.png'), 'Dimmed beach scene with shell focus', 'scene-overlay'),
  beachSceneWaterFocus: clientAsset(require('../../assets/client/icons/icon-103.png'), 'Dimmed beach scene with water focus', 'scene-overlay'),
  beachSceneSandFocus: clientAsset(require('../../assets/client/icons/icon-104.png'), 'Dimmed beach scene with sand focus', 'scene-overlay'),
  blanksOneCover: clientAsset(require('../../assets/client/icons/icon-105.png'), 'Blanks 1 course cover', 'learning-cover'),
  blanksTwoCover: clientAsset(require('../../assets/client/icons/icon-106.png'), 'Blanks 2 course cover', 'learning-cover'),
  describingPicturesOneCover: clientAsset(require('../../assets/client/icons/icon-107.png'), 'Describing Pictures 1 course cover', 'learning-cover'),
  describingPicturesTwoCover: clientAsset(require('../../assets/client/icons/icon-108.png'), 'Describing Pictures 2 course cover', 'learning-cover'),
  learningIsFunCover: clientAsset(require('../../assets/client/icons/icon-109.png'), 'Learning is Fun course cover', 'learning-cover'),
  oppositesCover: clientAsset(require('../../assets/client/icons/icon-110.png'), 'Opposites course cover', 'learning-cover'),
  narrativeInferencingCover: clientAsset(require('../../assets/client/icons/icon-111.png'), 'Narrative Inferencing course cover', 'learning-cover'),
  colourfulSemanticsOneCover: clientAsset(require('../../assets/client/icons/icon-112.png'), 'Colourful Semantics 1 course cover', 'learning-cover'),
  colourfulSemanticsTwoCover: clientAsset(require('../../assets/client/icons/icon-113.png'), 'Colourful Semantics 2 course cover', 'learning-cover'),
  pencil: clientAsset(require('../../assets/client/icons/icon-114.png'), 'Pencil', 'vocabulary-card'),
  laptop: clientAsset(require('../../assets/client/icons/icon-115.png'), 'Laptop', 'vocabulary-card'),
  elephant: clientAsset(require('../../assets/client/icons/icon-116.png'), 'Elephant', 'vocabulary-card'),
} as const satisfies Record<string, ClientAsset>;

export type ClientSceneAssetKey = keyof typeof clientSceneAssets;
export type ClientIconAssetKey = keyof typeof clientIconAssets;

export const clientAssetRegistry = {
  scenes: clientSceneAssets,
  icons: clientIconAssets,
} as const;
