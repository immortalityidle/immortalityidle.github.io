import { Injectable, Injector, signal } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from './character.service';
import { InventoryService } from './inventory.service';
import { HomeService, HomeType } from './home.service';
import { ItemRepoService } from './item-repo.service';
import { StoreService } from './store.service';
import { MainLoopService } from './main-loop.service';
import { BattleService } from './battle.service';
import { GameStateService } from './game-state.service';
import { ActivityService } from './activity.service';
import { ActivityType } from './activity';
import { ImpossibleTaskService } from './impossibleTask.service';
import { FollowersService } from './followers.service';
import { HellService } from './hell.service';
import { FarmService } from './farm.service';
import { LocationService } from './location.service';
import { MatDialog } from '@angular/material/dialog';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { MemoriesPanelComponent } from '../memories-panel/memories-panel.component';

export interface Achievement {
  name: string;
  /**Necessary for name changes due to save structure using name (above) instead of ids */
  displayName?: string;
  description: string;
  hint: string;
  check: () => boolean;
  effect: () => void;
  unlocked: boolean;
}

export interface AchievementProperties {
  unlockedAchievements: string[];
  unlockedMemories: string[];
}

export const MEMORY_SPIRITUALITY = 'Sprituality';
export const MEMORY_ASCENSION = 'Ascension';
export const MEMORY_QI_UNLOCKED = 'QiUnlocked';
export const MEMORY_IMPOSSIBLE_TASKS = 'ImpossibleTasks';
export const MEMORY_IMMORTALITY = 'Immortality';
export const MEMORY_JOIN_THE_GODS = 'JoinTheGods';
export const MEMORY_HELL_COMPLETION = 'HellCompletion';

export interface Memory {
  title: string;
  text: string[];
  imageBaseName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  gameStateService?: GameStateService;
  unlockedAchievements: string[] = [];
  unlockedMemories: string[] = [];
  memoriesUnlocked = signal<boolean>(false);

  memories: { [key: string]: Memory } = {
    [MEMORY_SPIRITUALITY]: {
      title: 'A Spiritual Awakening',
      text: [
        'A stirring deep in the center of your being has begun, the start of your path to spirituality.<br><br>You find that your resting has become more than mere relaxing to refresh your mind and body.<br><br>Your newfound capacity for contemplation, reflection, and clearing your mind has unlocked a powerful new path in your development toward immortality.',
      ],
      imageBaseName: 'spirituality',
    },
    [MEMORY_ASCENSION]: {
      title: 'Ascension',
      text: [
        'Your whole lifetime has been building up to this moment.<br><br>You have overcome fierce monsters, honed your abilities, and prepared your spirit to ascend to powers your past lives could only dream of.<br><br>You close your eyes and embrace your destiny.',
      ],
      imageBaseName: 'ascension',
    },
    [MEMORY_QI_UNLOCKED]: {
      title: 'The Power of Qi',
      text: [
        'A tingle begins in your fingertips.<br><br>You feel the flow of Qi, a power that has always resided inside of you but was, until now, beyond your conscious control.<br><br>The power concentrates until if fills your hand, ready to be unleashed.<br><br>You have a great deal of training to do before you can make effective use of this power against your foes, but the door to unleashing your inner strength is finally unlocked.',
      ],
      imageBaseName: 'qiUnlocked',
    },
    [MEMORY_IMPOSSIBLE_TASKS]: {
      title: 'Impossible Tasks',
      text: [
        "You are finally ready to seek out true immortality.<br><br>Your consummate searching has yielded your first clue: a scrap in an ancient text that leads you to believe that the secret of immortality lies in the ruins of an ancient civilization buried deep beneath the ocean's currents.",
      ],
      imageBaseName: 'impossibleTasks',
    },
    [MEMORY_IMMORTALITY]: {
      title: 'Immortality',
      text: [
        'The essence of immortality flows into your core, infusing your soul with the power to defy death in all its forms.<br><br>You are no longer subject to disease, dying of your injuries, or the infirmities of old age.<br><br>You are no longer trapped in the continual cylce of reincarnation, though you feel you could still give up your current life and be reborn in a new immortal body should you so choose.<br><br>The distant outline of Mount Penglai, the home of the gods, catches your eye.<br><br>Now that you are immortal, could you dare to claim a place of your own there?',
      ],
      imageBaseName: 'immortality',
    },
    [MEMORY_JOIN_THE_GODS]: {
      title: 'Joining the Gods',
      text: [
        'You ascend into the heavens, wind roaring past as your body cleaves through the sky like a blade.<br><br>The mortal world fades beneath your feet—villages, mountains, rivers—all growing smaller as you rise above the realm of men.<br><br>Over the Kunlun mountains, past sacred Mount Tai, and beyond the icy breath of the Jade Peaks, you cross the edge of the world itself.<br><br>The sea opens up before you like a mirror of the sky, and in the far distance, Mount Penglai emerges—an immortal isle shrouded in mist and crowned with golden light.',
        "Above the snowy slopes of Penglai, the mountain peak splits the clouds like a divine spear.<br><br>Atop it stands the legendary Golden Palace, radiant as the sun, its high walls wreathed in drifting silk-clouds and surrounded by a forest unlike any you've seen.<br><br>Jewels hang like fruit from crystalline branches, and fragrant blossoms pulse with the qi of eternity.<br><br>The orchard is said to bear fruits of eternal youth, yet despite your years of cultivation, you cannot help but feel a small pang of inadequacy.<br><br>Your own peaches never shone so brightly.<br><br>No matter how carefully you tended your land, they were never this... divine.<br><br>You suppress the feeling.<br><br>You are immortal now.<br><br>You have crossed the threshold few dare even to dream of.<br><br>You belong here — don’t you?",
        'You pass beneath the golden arch and step into a vast courtyard paved with polished stone.<br><br>The divine pressure here weighs heavy on your shoulders, more profound than anything the mortal world ever offered.<br><br>Seated before you are the gods themselves—an assembly of beings who rule the celestial realms.<br><br>The Eight Immortals recline in ease, each holding their sacred artifact, laughing at jokes older than dynasties.<br><br>Nuwa and Fuxi speak in low, gentle tones.<br><br>The Queen Mother of the West exchanges rare smiles with Caishen, god of wealth, clad in silks finer than mortal imagination.<br><br>And at the heart of them all—on the highest of the golden thrones—sits the Jade Emperor, Shangti, expression unreadable.',
        'Shangti claps his hands.<br><br>"Ah. The young upstart who has caused such noise in the mortal realm has finally arrived."',
        'Every divine eye turns toward you, and though none speak, their silence speaks volumes.<br><br>Their gazes are not kind.<br><br>Their stares are not welcoming.',
        'You nod respectfully and step closer, the celestial qi around you thickening.<br><br>Among the countless golden thrones, one—off to the side—is conspicuously empty.<br><br>Your eyes rest on it for just a moment too long. A seat waiting to be claimed, perhaps?<br><br>Or a reminder of what you have not yet earned?',
        '"I suppose you feel you deserve a place here now, do you?<br><br>Fight a few monsters.<br><br>Improve yourself a little.<br><br>Conquer your fellow mortals.<br><br>And suddenly, you think you\'re a god?"',
        'You prepare to speak, to recount the years of pain and meditation, the near-death battles, the countless nights spent perfecting your meridians and soul core beneath the stars.<br><br>But before you can utter a word, another voice cuts through the air like a thunderclap.',
        '"Nonsense!<br><br>This upstart destroyed one of my finest servants and committed myriad sins that still scream from the lower realms.<br><br>A karmic debt weighs heavy and no price has been paid."',
        '"And what do you propose, Lord Yama?<br><br>The child has shown the strength to ascend and the determination to rise.<br><br>That empty throne will not remain empty forever."',
        '"Send the upstart to my domain.<br><br>Let the eighteen hells purge the karmic debt.<br><br>If this child is to sit among us, the price must be paid in fire, blade, sorrow, and shadow."',
        'Another god speaks out from the nearby mountains.<br><br>"Lord Yama\'s proposal seems fair.<br><br>The child has power, yes — but no balance.<br><br>The yin and yang within are a storm.<br><br>A few millennia under Yama\'s watch will do the upstart good, granting temperence... or the peace of utter destruction. Either way, the problem is resolved."',
        'Whispers and nods ripple through the gathering.<br><br>The weight of judgment hangs in the air, and no voice rises in protest.',
        '"Your words are wise, as always, Pan Gu."<br><br>The Jade Emperor turns to face you again.<br><br>"Let the upstart be cast into the eighteen hells.<br><br>Should the experience teach wisdom rather than despair, then we shall welcome the child as one of us."',
        'Before you can voice a word of protest, the Emperor lifts a single hand.<br><br>The space around you fractures like glass struck by divine force.<br><br>Light and sound vanish.<br><br>You fall — not through space, but through reality itself.',
        'You awaken—or perhaps arrive—in a vast, empty stone chamber.<br><br>The air is cold, dry, silent.<br><br>Above, darkness.<br><br>Below, the faint shimmer of runes etched into stone.<br><br>Around you stand eighteen open gates, each one a maw leading to a different hell.<br><br>You can feel them calling to you.<br><br>Testing you.<br><br>Daring you.',
        'You hear the Jade Emperor\'s voice one last time.<br><br>"If you are worthy, you will return. If not, you will serve as a warning to those who think mere strength makes a god."<br><br>It looks like you have a new challenge ahead: Escape this underworld and prove your worth to the gods.<br><br>You brace yourself for the horrors you will face as you step through the first portal.',
      ],
      imageBaseName: 'joinTheGods',
    },
    [MEMORY_HELL_COMPLETION]: {
      title: 'Hell Vanquished!',
      text: [
        'Lord Yama lies defeated before you, unable to stand against your strength.<br><br>He bows in acknowledgement of your growth in both character and prowess.<br><br>"Take this key, child."<br><br>Lord Yama hands you a glowing artifact.<br><br>"The portals will answer to you now. You may return now to the Divine Realm to claim your rightful place. Welcome home, young upstart, and may the heavens continue to smile upon you."<br><br>',
      ],
      imageBaseName: 'hellCompletion',
    },
  };

  constructor(
    private mainLoopService: MainLoopService,
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    private storeService: StoreService,
    private battleService: BattleService,
    private homeService: HomeService,
    private farmService: FarmService,
    private activityService: ActivityService,
    private followerService: FollowersService,
    private impossibleTaskService: ImpossibleTaskService,
    private hellService: HellService,
    private locationService: LocationService,
    private dialog: MatDialog
  ) {
    this.mainLoopService.longTickSubject.subscribe(() => {
      if (!this.gameStateService) {
        this.gameStateService = this.injector.get(GameStateService);
      }
      for (const achievement of this.achievements) {
        if (!this.unlockedAchievements.includes(achievement.name)) {
          if (achievement.check()) {
            this.unlockAchievement(achievement, true);
          }
        }
      }
    });
  }

  // important: achievement effects must be idempotent as they may be called multiple times
  achievements: Achievement[] = [
    {
      name: 'One Week',
      description: 'You survived your first week of this game!',
      hint: 'Try some activities.',
      check: () => {
        return this.mainLoopService.totalTicks > 7;
      },
      effect: () => {
        this.mainLoopService.timeUnlocked = true;
        this.gameStateService!.unlockPanel('timePanel');
        this.gameStateService!.addLayoutPanel('timePanel', 0, 8, 30, 6);
        this.gameStateService!.unlockPanel('schedulePanel');
        this.gameStateService!.addLayoutPanel('schedulePanel', 0, 14, 30, 14);
      },
      unlocked: false,
    },
    {
      name: 'Big Earner',
      description:
        'You earned your first few taels by working hard.<br>Maybe you should invest in some land and a better home.',
      hint: 'Make some money.',
      check: () => {
        return this.characterService.money >= 100;
      },
      effect: () => {
        this.homeService.homeUnlocked = true;
        this.gameStateService!.unlockPanel('homePanel');
        this.gameStateService!.addLayoutPanel('homePanel', 68, 15, 30, 20);
      },
      unlocked: false,
    },
    {
      name: 'Bigger Earner',
      description: 'You earned your first million taels! Do you feel rich yet?',
      hint: 'Make some more money.',
      check: () => {
        return this.characterService.money >= 1000000;
      },
      effect: () => {
        // no effect
      },
      unlocked: false,
    },
    {
      name: 'Biggest Earner',
      description: 'You earned your first trillion taels! Your greed knows no bounds.',
      hint: 'Make even more money.',
      check: () => {
        return this.characterService.money >= 1000000000000;
      },
      effect: () => {
        // no effect
      },
      unlocked: false,
    },
    {
      name: 'Bookworm',
      description:
        'You opened the manuals shop and unlocked the ' + this.itemRepoService.items['restartActivityManual'].name,
      hint: 'There are lots of buttons in this game, maybe an aspiring immortal should press a few.',
      check: () => {
        return this.storeService.storeOpened;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['restartActivityManual']);
      },
      unlocked: false,
    },
    {
      name: 'Played a Bit',
      description:
        'You worked toward immortality for ten years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fastPlayManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.mainLoopService.totalTicks > 3650;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Basically an Expert',
      description:
        'You worked toward immortality for one hundred years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fasterPlayManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.mainLoopService.totalTicks > 36500;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fasterPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Farmer',
      description: 'You plowed your first field!',
      hint: 'Cultivation might be important for cultivation.',
      check: () => {
        return this.farmService.fallowPlots > 0;
      },
      effect: () => {
        this.gameStateService?.unlockPanel('farmPanel');
      },
      unlocked: false,
    },
    {
      name: 'Gear Up!',
      description: 'You created some equipment and now you can wear it.',
      hint: 'Some jobs let you make stuff you can use.',
      check: () => {
        return (
          this.inventoryService.equipmentCreated > 0 ||
          this.characterService.equipment.head !== null ||
          this.characterService.equipment.body !== null ||
          this.characterService.equipment.leftHand !== null ||
          this.characterService.equipment.rightHand !== null ||
          this.characterService.equipment.legs !== null ||
          this.characterService.equipment.feet !== null
        );
      },
      effect: () => {
        this.inventoryService.equipmentUnlocked = true;
        this.gameStateService!.unlockPanel('equipmentPanel');
      },
      unlocked: false,
    },
    {
      name: 'Stuff!',
      description: 'You got your first item.',
      hint: 'Find anything.',
      check: () => {
        return this.inventoryService.totalItemsReceived > 0;
      },
      effect: () => {
        this.gameStateService!.unlockPanel('inventoryPanel');
      },
      unlocked: false,
    },
    {
      name: 'Attack!',
      description: 'You are under attack by an enemy.',
      hint: 'They are coming for you.',
      check: () => {
        return this.battleService.totalEnemies > 0;
      },
      effect: () => {
        this.battleService.battlesUnlocked = true;
        this.gameStateService!.unlockPanel('battlePanel');
        this.gameStateService!.addLayoutPanel('battlePanel', 68, 35, 30, 20);
      },
      unlocked: false,
    },
    {
      name: 'Spiritual Awakening',
      description: 'You have honed your mind and body enough to begin meditating to develop your spirit.',
      hint: 'An aspiring immortal needs to develop all the basic attributes.',
      check: () => {
        return (
          this.characterService.attributes.strength.value >= 1000 &&
          this.characterService.attributes.speed.value >= 1000 &&
          this.characterService.attributes.charisma.value >= 1000 &&
          this.characterService.attributes.intelligence.value >= 1000 &&
          this.characterService.attributes.toughness.value >= 1000
        );
      },
      effect: () => {
        if (!this.unlockedMemories.includes(MEMORY_SPIRITUALITY)) {
          this.triggerMemory(MEMORY_SPIRITUALITY);
        }
      },
      unlocked: false,
    },
    {
      name: 'Persistent Reincarnator',
      description:
        'You lived one thousand years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['fastestPlayManual'].name,
      hint: 'The millennial.',
      check: () => {
        return this.mainLoopService.totalTicks > 365000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['fastestPlayManual']);
      },
      unlocked: false,
    },
    {
      name: 'Cabbage Stand',
      description: 'You can now grow cabbage in your farm. Watch out for kids running by when you sell them.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 2;
      },
      effect: () => {
        this.farmService.unlockCrop('cabbage');
      },
      unlocked: false,
    },
    {
      name: 'The Magical Fruit',
      description: 'You can now grow beans in your farm.',
      hint: "They're not really a fruit.",
      check: () => {
        return this.characterService.attributes.woodLore.value > 5;
      },
      effect: () => {
        this.farmService.unlockCrop('beans');
      },
      unlocked: false,
    },
    {
      name: 'Little Green Trees',
      description: 'You can now grow broccoli in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 10;
      },
      effect: () => {
        this.farmService.unlockCrop('broccoli');
      },
      unlocked: false,
    },
    {
      name: 'A Gourd You Might Not Know',
      description: 'You can now grow calabash in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 50;
      },
      effect: () => {
        this.farmService.unlockCrop('calabash');
      },
      unlocked: false,
    },
    {
      name: "It's Not Just for Boba",
      description: 'You can now grow taro in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 100;
      },
      effect: () => {
        this.farmService.unlockCrop('taro');
      },
      unlocked: false,
    },
    {
      name: 'First Fruits',
      description: 'You can now grow pears in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 1000;
      },
      effect: () => {
        this.farmService.unlockCrop('pear');
      },
      unlocked: false,
    },
    {
      name: 'They Come in Different Sizes',
      description: 'You can now grow melons in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 10000;
      },
      effect: () => {
        this.farmService.unlockCrop('melon');
      },
      unlocked: false,
    },
    {
      name: 'Purple Sweet and Sour',
      description: 'You can now grow plums in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 1e6;
      },
      effect: () => {
        this.farmService.unlockCrop('plum');
      },
      unlocked: false,
    },
    {
      name: 'A Tiny Taste of Immortality',
      description: 'You can now grow apricot in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 1e9;
      },
      effect: () => {
        this.farmService.unlockCrop('apricot');
      },
      unlocked: false,
    },
    {
      name: 'Almost Eating Like an Immortal',
      description: 'You can now grow peaches in your farm.',
      hint: 'Work that farm!',
      check: () => {
        return this.characterService.attributes.woodLore.value > 1e12;
      },
      effect: () => {
        this.farmService.unlockCrop('peach');
      },
      unlocked: false,
    },
    {
      name: 'Sweeter Still',
      description: 'You can now grow Divine Peaches in your farm.',
      hint: 'Descend to the depths and bring back the sweetest fruit.',
      check: () => {
        return this.inventoryService.divinePeachesUnlocked;
      },
      effect: () => {
        this.farmService.unlockCrop('divinePeach');
      },
      unlocked: false,
    },
    {
      name: 'Veteran Cultivator',
      description:
        'You lived ten thousand years across your lifetimes and unlocked the ' +
        this.itemRepoService.items['totalPlaytimeManual'].name,
      hint: 'A long life. Myriad years.',
      check: () => {
        return this.mainLoopService.totalTicks > 3650000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['totalPlaytimeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Going Places',
      description: 'You have reached beyond the confines of your home town and started to explore the wider world.',
      hint: 'Run, Forrest, Run!',
      check: () => {
        return this.locationService.unlockedLocations.length > 2;
      },
      effect: () => {
        this.gameStateService?.unlockPanel('locationPanel');
      },
      unlocked: false,
    },

    {
      name: 'Arts and Crafts',
      description:
        'You have unlocked your very own workstations to create your own gear, meals, potions, and pills. You can now access the crafting panel.',
      hint: 'You need a big house for this.',
      check: () => {
        return this.homeService.home.maxWorkstations > 0;
      },
      effect: () => {
        this.gameStateService?.unlockPanel('craftingPanel');
      },
      unlocked: false,
    },
    {
      name: 'Clang! Clang! Clang!',
      description:
        'You reached proficiency in blacksmithing and can now work as a Blacksmith without going through an apprenticeship (you still need the attributes for the Blacksmithing activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Blacksmithing);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Bubble, Bubble',
      description:
        'You reached proficiency in alchemy and can now work as a Alchemist without going through an apprenticeship (you still need the attributes for the Alchemy activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Alchemy);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Tanner',
      description:
        'You reached proficiency in leatherworking and can now work as a Leatherworker without going through an apprenticeship (you still need the attributes for the Leatherworking activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Leatherworking);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Carpenter',
      description:
        'You reached proficiency in woodworking and can now work as a Woodworker without going through an apprenticeship (you still need the attributes for the Woodworking activity).',
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return this.activityService.completedApprenticeships.includes(ActivityType.Woodworking);
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Just Put It Over There',
      description:
        'You have become an expert at loading inputs into your crafting workstations, and have unlocked a manual to automatically load workstations as you acquire more of the same ingredients.',
      hint: 'It sure would be nice to have the ore just go right into the smelter.',
      check: () => {
        return this.homeService.totalCrafts > 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['perpetualCraftingManual']);
      },
      unlocked: false,
    },
    {
      name: 'Addict',
      description: 'You got a taste of those sweet, sweet empowerment pills and want more.',
      hint: 'Master of all.',
      check: () => {
        return this.characterService.empowermentFactor > 1;
      },
      effect: () => {
        //TODO: Create a downside to taking empowerment pills, maybe post-Death
      },
      unlocked: false,
    },
    {
      name: 'Habitual User',
      displayName: 'Dope',
      description:
        "You got every last drop you could out of those pills and now you feel nothing from them.<br>At least they didn't kill you or do lasting harm, right?",
      hint: 'D.A.R.E.',
      check: () => {
        return this.characterService.empowermentFactor >= 1953.65;
      },
      effect: () => {
        //TODO: Create a downside to taking HUGE NUMBERS of empowerment pills, maybe in Hell?
      },
      unlocked: false,
    },
    {
      name: 'Rice, Rice, Baby',
      description:
        "You've eaten healthy food 88 items and unlocked the " + this.itemRepoService.items['autoEatManual'].name,
      hint: 'Better than dumpster diving.',
      check: () => {
        return this.inventoryService.lifetimeUsedFood >= 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoEatManual']);
      },
      unlocked: false,
    },
    {
      name: 'Eat Like Goku',
      description:
        "You've eaten way more than you should have for 8888 days and unlocked the " +
        this.itemRepoService.items['basicGluttonyManual'].name,
      hint: "You'll get a tummyache.",
      check: () => {
        return this.inventoryService.daysGorged >= 8888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['basicGluttonyManual']);
      },
      unlocked: false,
    },
    {
      name: 'Eat Like Luffy',
      description:
        "You've eaten way more than you should have for 88888888 days and unlocked the " +
        this.itemRepoService.items['advancedGluttonyManual'].name,
      hint: "No, don't eat that much, you'll get sick for sure.",
      check: () => {
        return this.inventoryService.daysGorged >= 88888888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['advancedGluttonyManual']);
      },
      unlocked: false,
    },
    {
      name: 'Snack Time!',
      description:
        "You stopped in the middle of battle and sat down for a meal 8888 times. Seriously? You couldn't wait until the fight was over to eat? Well, now you get to do it more often.",
      hint: 'Meals on the go.',
      check: () => {
        return this.battleService.pouchFoodUsed >= 8888;
      },
      effect: () => {
        this.battleService.foodCooldown = 40;
      },
      unlocked: false,
    },
    {
      name: 'This Sparks Joy',
      description: 'You used 888 items and unlocked the ' + this.itemRepoService.items['autoUseManual'].name,
      hint: 'Immortals should know the potential of the things they use.',
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoUseManual']);
      },
      unlocked: false,
    },
    {
      name: 'This Does Not Spark Joy',
      description:
        'You filled your entire inventory and unlocked the ' + this.itemRepoService.items['autoSellManual'].name,
      hint: 'So much stuff.',
      check: () => {
        return this.inventoryService.openInventorySlots() === 0;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoSellManual']);
      },
      unlocked: false,
    },
    {
      name: 'Waster',
      description:
        'You throw away 10,000 items and unlocked the ' + this.itemRepoService.items['betterStorageManual'].name,
      hint: 'Too much stuff.',
      check: () => {
        return this.inventoryService.thrownAwayItems >= 10000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['betterStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'Landfill',
      description:
        'You throw away 100,000 items and unlocked the ' + this.itemRepoService.items['evenBetterStorageManual'].name,
      hint: 'Way, way too much stuff.',
      check: () => {
        return this.inventoryService.maxStackSize >= 1000 && this.inventoryService.thrownAwayItems >= 100000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['evenBetterStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'Hoarder',
      description:
        'You really love holding vast amounts of materials and unlocked the ' +
        this.itemRepoService.items['bestStorageManual'].name,
      hint: "Just stop already, it's too much.<br>Why would an aspiring immortal need this much stuff?",
      check: () => {
        return this.inventoryService.maxStackSize >= 10000 && this.inventoryService.thrownAwayItems >= 1000000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestStorageManual']);
      },
      unlocked: false,
    },
    {
      name: 'All Things In Moderation',
      hint: 'Immortals know what to use and what to toss.',
      description:
        'You sold and used 8888 items and unlocked the ' + this.itemRepoService.items['autoBalanceManual'].name,
      check: () => {
        return this.inventoryService.lifetimeUsedItems >= 8888 && this.inventoryService.lifetimeSoldItems >= 8888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoBalanceManual']);
      },
      unlocked: false,
    },
    {
      name: 'Land Rush',
      description: 'Your vast tracts of land make you the envy of all your neighbors',
      hint: 'Immortals are known for their vast real estate holdings.',
      check: () => {
        return this.homeService.land >= 520;
      },
      effect: () => {
        // blank
      },
      unlocked: false,
    },
    {
      name: 'Real Housewives of Immortality',
      description:
        'You acquired a very fine home and will now start each life with additional stamina from the abundance available in your youth.<br>Did you just become the young master?',
      hint: 'Immortals value a good home.',
      check: () => {
        return this.homeService.homeValue >= HomeType.CourtyardHouse;
      },
      effect: () => {
        this.characterService.startingStaminaBoost = true;
      },
      unlocked: false,
    },
    {
      name: 'Off to Ikea',
      description:
        'You set up some great furniture and can now better discern where furniture items should go to improve the flow of Qi in your home.',
      hint: 'Immortals have discerning taste in furnishings.',
      check: () => {
        return this.characterService.fengshuiScore >= 5;
      },
      effect: () => {
        this.homeService.seeFurnitureEffects = true;
      },
      unlocked: false,
    },
    {
      name: "Don't Sell My Bed!",
      description:
        'Your taste in decor is so excellent that the furniture in your bedroom will be preserved untouched until your next reincarnation.',
      hint: 'Strong family bonds mean more heirlooms.',
      check: () => {
        return this.characterService.fengshuiScore >= 10;
      },
      effect: () => {
        this.homeService.keepFurniture = true;
      },
      unlocked: false,
    },
    {
      name: 'Time to Buy a Tractor',
      description:
        'You plowed 888 fields and unlocked the ' + this.itemRepoService.items['basicHealthRegenerationManual'].name,
      hint: 'An aspiring immortal should have vast tracts of fertile land.',
      check: () => {
        return this.farmService.mostFields >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['basicHealthRegenerationManual']);
      },
      unlocked: false,
    },
    {
      name: 'Industrial Revolution',
      description: "You've mastered many professions. Good job!",
      hint: 'Hard work has many rewards.',
      check: () => {
        return (
          this.activityService.completedApprenticeships.includes(ActivityType.Blacksmithing) &&
          this.activityService.completedApprenticeships.includes(ActivityType.Alchemy) &&
          this.activityService.completedApprenticeships.includes(ActivityType.Leatherworking) &&
          this.activityService.completedApprenticeships.includes(ActivityType.Woodworking)
        );
      },
      effect: () => {
        // blank
      },
      unlocked: false,
    },
    {
      name: 'First Sip',
      description: 'You drank your first potions and unlocked a special equipment slot',
      hint: "Just take a taste. You'll like it.",
      check: () => {
        return this.inventoryService.lifetimePotionsUsed >= 1;
      },
      effect: () => {
        if (this.characterService.itemPouches.length < 1) {
          // open up an item pouch slot if one isn't open yet
          this.characterService.itemPouches.push(this.inventoryService.getEmptyItemStack());
        }
      },
      unlocked: false,
    },
    {
      name: 'Guzzler',
      description: 'You drank 888 potions and unlocked a second potion slot.',
      hint: 'Glug, glug, glug.',
      check: () => {
        return this.inventoryService.lifetimePotionsUsed >= 88;
      },
      effect: () => {
        if (this.characterService.itemPouches.length < 2) {
          // open up an item pouch slot if one isn't open yet
          this.characterService.itemPouches.push(this.inventoryService.getEmptyItemStack());
        }
      },
      unlocked: false,
    },
    {
      name: 'Emergency Swig',
      description: 'You drank 8888 equipped potions and reduced your potion cooldown.',
      hint: "It's just for medicinal use, I promise. I can stop whenever I want.",
      check: () => {
        return this.battleService.pouchPotionsUsed >= 8888;
      },
      effect: () => {
        this.battleService.potionCooldown = 10;
      },
      unlocked: false,
    },
    {
      name: 'Junkie',
      description:
        'You took 88 pills in one lifetime and unlocked the ' + this.itemRepoService.items['autoPillManual'].name,
      hint: 'An aspiring immortal should take the red one.<br>Take it over and over.',
      check: () => {
        return this.inventoryService.lifetimePillsUsed >= 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPillManual']);
      },
      unlocked: false,
    },
    {
      name: 'Monster Slayer',
      description: 'You fought 131 monsters and unlocked the ' + this.itemRepoService.items['autoTroubleManual'].name,
      hint: 'An aspiring immortal bravely faces down their foes.',
      check: () => {
        return this.battleService.totalKills >= 131;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoTroubleManual']);
      },
      unlocked: false,
    },
    {
      name: 'Monster Hunter',
      description: 'You tracked down and killed 20  different kinds of monsters. Good job!',
      hint: 'An aspiring immortal bravely faces down many kinds of foes.',
      check: () => {
        return Object.keys(this.battleService.killsByMonster).length >= 20;
      },
      effect: () => {
        // no effect
      },
      unlocked: false,
    },
    {
      name: 'Monster Exterminator',
      description: 'You tracked down and killed 40  different kinds of monsters. Good job!',
      hint: "It's almost like pokemon, but with less catching.",
      check: () => {
        return Object.keys(this.battleService.killsByMonster).length >= 40;
      },
      effect: () => {
        // no effect
      },
      unlocked: false,
    },
    {
      name: 'Weapons Master',
      description:
        'You wielded powerful weapons of both metal and wood and unlocked the ' +
        this.itemRepoService.items['autoWeaponMergeManual'].name,
      hint: 'Left and right.',
      check: () => {
        if (
          this.characterService.equipment?.rightHand?.weaponStats &&
          this.characterService.equipment?.rightHand?.weaponStats.baseDamage >= 60 &&
          this.characterService.equipment?.leftHand?.weaponStats &&
          this.characterService.equipment?.leftHand?.weaponStats.baseDamage >= 60
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoWeaponMergeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Practically Invincible',
      description:
        'You equipped yourself with powerful armor and unlocked the ' +
        this.itemRepoService.items['autoArmorMergeManual'].name,
      hint: 'Suit up.',
      check: () => {
        if (
          this.characterService.equipment?.head?.armorStats &&
          this.characterService.equipment?.head?.armorStats.defense >= 60 &&
          this.characterService.equipment?.body?.armorStats &&
          this.characterService.equipment?.body?.armorStats.defense >= 60 &&
          this.characterService.equipment?.legs?.armorStats &&
          this.characterService.equipment?.legs?.armorStats.defense >= 60 &&
          this.characterService.equipment?.feet?.armorStats &&
          this.characterService.equipment?.feet?.armorStats.defense >= 60
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoArmorMergeManual']);
      },
      unlocked: false,
    },
    {
      name: 'Gemologist',
      description: 'You acquired 88 gems and unlocked the ' + this.itemRepoService.items['useSpiritGemManual'].name,
      hint: 'Ooh, shiny.',
      check: () => {
        return this.inventoryService.gemsAcquired >= 88;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['useSpiritGemManual']);
      },
      unlocked: false,
    },
    {
      name: 'Ingredient Snob',
      description:
        'You achieved a deep understanding of herbs and unlocked the ' +
        this.itemRepoService.items['bestHerbsManual'].name,
      hint: 'An aspiring immortal should take the red one. Take it over and over.',
      check: () => {
        return (
          this.characterService.attributes.woodLore.value > 1024 &&
          this.characterService.attributes.waterLore.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestHerbsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Wood Snob',
      description:
        'You achieved a deep understanding of wood and unlocked the ' +
        this.itemRepoService.items['bestWoodManual'].name,
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return (
          this.characterService.attributes.woodLore.value > 1024 &&
          this.characterService.attributes.intelligence.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWoodManual']);
      },
      unlocked: false,
    },
    {
      name: 'Ore Snob',
      displayName: 'Smelting Snob',
      description:
        'You achieved a deep understanding of digging and smelting metal and unlocked the ' +
        this.itemRepoService.items['bestOreManual'].name,
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return (
          this.characterService.attributes.metalLore.value > 1024 &&
          this.characterService.attributes.earthLore.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestOreManual']);
      },
      unlocked: false,
    },
    {
      name: 'Hide Snob',
      displayName: 'Hunting Snob',
      description:
        'You achieved a deep understanding of hunting and gathering hides and unlocked the ' +
        this.itemRepoService.items['bestHidesManual'].name,
      hint: 'There are lots of activities an aspiring immortal can do on their way to immortality.<br>Maybe you should try getting good at a few of them.',
      check: () => {
        return (
          this.characterService.attributes.animalHandling.value > 1024 &&
          this.characterService.attributes.speed.value > 1024
        );
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestHidesManual']);
      },
      unlocked: false,
    },
    {
      name: 'Gem Snob',
      description: 'You have sold 888 gems and unlocked the ' + this.itemRepoService.items['bestGemsManual'].name,
      hint: 'I hear the market for fine jewelry is so hot right now.',
      check: () => {
        return this.inventoryService.lifetimeGemsSold >= 888;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestGemsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Unlimited Taels',
      description:
        'Your family has unlocked the secrets of compound interest.<br>You probably never have to worry about money again.',
      hint: 'Family first. Especially in matters of money.',
      check: () => {
        return this.characterService.bloodlineRank >= 4;
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Not Unlimited Taels',
      description:
        "You filled up your purse, your wall safe, the box under your bed, and a giant money pit in the backyard.<br>You just can't hold any more money.",
      hint: 'How rich can you get?',
      check: () => {
        return this.characterService.money >= this.characterService.maxMoney - 1e21; //not exactly max in case this gets checked at a bad time
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: "Grandpa's Old Tent",
      description: "You've gone through four cycles of reincarnation and come to understand the value of grandfathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.totalLives > 4;
      },
      effect: () => {
        this.homeService.grandfatherTent = true;
      },
      unlocked: false,
    },
    {
      name: 'Paternal Pride',
      description: "You've worked 888 days of odd jobs and come to understand the value of fathers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.activityService.oddJobDays > 888;
      },
      effect: () => {
        this.characterService.fatherGift = true;
      },
      unlocked: false,
    },
    {
      name: 'Maternal Love',
      description: "You've done 888 days of begging and come to understand the value of mothers.",
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.activityService.beggingDays > 888;
      },
      effect: () => {
        this.inventoryService.motherGift = true;
      },
      unlocked: false,
    },
    {
      name: "Grandma's Stick",
      description: "You've developed enough spirituality to come to understand the value of grandmothers.",
      hint: "You'll need to meditate on this one to figure it out.",
      check: () => {
        return this.characterService.attributes.spirituality.value > 1;
      },
      effect: () => {
        this.inventoryService.grandmotherGift = true;
      },
      unlocked: false,
    },
    {
      name: 'Weapons Grandmaster',
      description:
        'You wielded epic weapons of both metal and wood and unlocked the ' +
        this.itemRepoService.items['bestWeaponManual'].name,
      hint: 'Power level 10,000!',
      check: () => {
        if (
          this.characterService.equipment?.rightHand?.weaponStats &&
          this.characterService.equipment?.rightHand?.weaponStats.baseDamage >= 8888 &&
          this.characterService.equipment?.leftHand?.weaponStats &&
          this.characterService.equipment?.leftHand?.weaponStats.baseDamage >= 8888
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestWeaponManual']);
      },
      unlocked: false,
    },
    {
      name: 'Tank!',
      description:
        'You armored yourself with epic defenses and unlocked the ' +
        this.itemRepoService.items['bestArmorManual'].name,
      hint: "Don't hurt me!",
      check: () => {
        if (
          this.characterService.equipment?.head?.armorStats &&
          this.characterService.equipment?.head?.armorStats.defense >= 8888 &&
          this.characterService.equipment?.body?.armorStats &&
          this.characterService.equipment?.body?.armorStats.defense >= 8888 &&
          this.characterService.equipment?.legs?.armorStats &&
          this.characterService.equipment?.legs?.armorStats.defense >= 8888 &&
          this.characterService.equipment?.feet?.armorStats &&
          this.characterService.equipment?.feet?.armorStats.defense >= 8888
        ) {
          return true;
        }
        return false;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bestArmorManual']);
      },
      unlocked: false,
    },
    {
      name: "You're a wizard now.",
      description:
        'Enlightenment!<br>You have achieved a permanent and deep understanding of elemental balance with your high, balanced levels of lore in each of the five elements.<br>Qi is now unlocked for all future lives.',
      hint: 'Seek the balance of the dao.',
      check: () => {
        const fireLore = this.characterService.attributes.fireLore.value;
        const earthLore = this.characterService.attributes.earthLore.value;
        const woodLore = this.characterService.attributes.woodLore.value;
        const waterLore = this.characterService.attributes.waterLore.value;
        const metalLore = this.characterService.attributes.metalLore.value; //Reduce the bulk

        const lowValue = Math.min(metalLore, waterLore, woodLore, earthLore, fireLore);
        const highValue = Math.max(metalLore, waterLore, woodLore, earthLore, fireLore);
        return lowValue >= 1000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        if (!this.unlockedMemories.includes(MEMORY_QI_UNLOCKED)) {
          this.triggerMemory(MEMORY_QI_UNLOCKED);
        }
        this.characterService.qiUnlocked = true;
        if (this.characterService.status.qi.max === 0) {
          this.characterService.status.qi.max = 1;
          this.characterService.status.qi.value = 1;
        }
        this.activityService.checkRequirements(true);
      },
      unlocked: false,
    },
    {
      name: 'Qi Infused',
      description:
        'You have saturated your body with qi energy and unlocked the ' +
        this.itemRepoService.items['basicQiRegenerateManual'].name,
      hint: "You'll need to infuse every last cell",
      check: () => {
        return this.characterService.healthBonusMagic >= 1000000;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['basicQiRegenerateManual']);
      },
      unlocked: false,
    },
    {
      name: 'Sect Leader',
      description: 'You have become powerful enough that you may now start attracting followers.',
      hint: 'Ascension has its privileges.',
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 1 &&
          this.characterService.meridianRank() >= 1 &&
          this.characterService.bloodlineRank >= 1
        );
      },
      effect: () => {
        this.followerService.followersUnlocked = true;
        this.gameStateService!.unlockPanel('followersPanel');
      },
      unlocked: false,
    },
    {
      name: 'Animal Friend',
      description: 'You have found your first pet and unlocked the Pets panel.',
      hint: 'Not all followers are humans.',
      check: () => {
        return this.followerService.pets.length > 0;
      },
      effect: () => {
        this.gameStateService!.unlockPanel('petsPanel');
      },
      unlocked: false,
    },
    {
      name: 'Preserved Ingredients',
      description: "Your family has learned to keep their ancestors' workstations exactly as they left them.",
      hint: "A good family knows not to touch Grandpa's herb stash.",
      check: () => {
        return this.characterService.bloodlineRank >= 6;
      },
      effect: () => {
        this.homeService.keepWorkstationInputs = true;
      },
      unlocked: false,
    },
    {
      name: 'Impossible',
      description: 'You have achieved incredible power and are ready to begin taking on impossible tasks.',
      hint: "No one can exceed the limits of humanity. It can't be done.",
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 9 &&
          this.characterService.meridianRank() >= 9 &&
          this.characterService.bloodlineRank >= 5
        );
      },
      effect: () => {
        if (!this.unlockedMemories.includes(MEMORY_IMPOSSIBLE_TASKS)) {
          this.triggerMemory(MEMORY_IMPOSSIBLE_TASKS);
        }
        this.impossibleTaskService.impossibleTasksUnlocked = true;
        this.gameStateService!.unlockPanel('impossibleTasksPanel');
      },
      unlocked: false,
    },
    {
      name: 'Ascended Techniques',
      description:
        'You have followed the path of immortality through your first ascension and can now start to develop special combat techniques that will be handed down through your family.',
      hint: 'Ascension has its privileges.',
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 1 ||
          this.characterService.meridianRank() >= 1 ||
          this.characterService.bloodlineRank >= 1
        );
      },
      effect: () => {
        if (!this.unlockedMemories.includes(MEMORY_ASCENSION)) {
          this.triggerMemory(MEMORY_ASCENSION);
        }
        if (this.battleService.maxFamilyTechniques < 1) {
          this.battleService.maxFamilyTechniques = 1;
        }
      },
      unlocked: false,
    },
    {
      name: 'Blazing Blood',
      description: 'Your ascensions have led you to the secrets of maintaining a second family combat technique.',
      hint: 'A strong family knows many techniques.',
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 5 &&
          this.characterService.meridianRank() >= 5 &&
          this.characterService.bloodlineRank >= 5
        );
      },
      effect: () => {
        if (this.battleService.maxFamilyTechniques < 2) {
          this.battleService.maxFamilyTechniques = 2;
        }
      },
      unlocked: false,
    },
    {
      name: 'Dragon Blood',
      description:
        'Your ascensions have led you to the secrets of maintaining a third family combat technique.<br>Your descendants will curse you for all the training they will have to do.',
      hint: 'An awe-inspiring family knows many techniques.',
      check: () => {
        return (
          this.characterService.soulCoreRank() >= 9 &&
          this.characterService.meridianRank() >= 9 &&
          this.characterService.bloodlineRank >= 8
        );
      },
      effect: () => {
        if (this.battleService.maxFamilyTechniques < 3) {
          this.battleService.maxFamilyTechniques = 3;
        }
      },
      unlocked: false,
    },
    {
      name: 'Bruce Is Proud of You',
      description: 'You have developed your first family technique and unlocked the Combat Techniques Panel.',
      hint: 'Train. Then train some more.',
      check: () => {
        return this.battleService.techniques.length > 3;
      },
      effect: () => {
        this.gameStateService?.unlockPanel('techniquePanel');
      },
      unlocked: false,
    },
    {
      name: 'Sturdy Walls',
      description: 'You have built a home strong enough to endure for generations.',
      hint: 'Build back better.',
      check: () => {
        return this.homeService.home.type >= HomeType.SimpleHut;
      },
      effect: () => {
        this.homeService.keepHome = true;
      },
      unlocked: false,
    },
    {
      name: 'Dusty Potions',
      description:
        'Your descendants have so much respect for you that they will preserve all your equipped potions for when you are reborn.',
      hint: 'You think this is still safe to drink?',
      check: () => {
        return this.characterService.bloodlineRank >= 2 && this.characterService.itemPouches.length > 0;
      },
      effect: () => {
        this.characterService.keepPouchItems = true;
      },
      unlocked: false,
    },
    {
      name: "Don't Sell My Stuff!",
      description:
        'Your descendants have so much respect for you that they will preserve one stack of items for your next reincarnation.',
      hint: 'Strong family bonds have advantages.',
      check: () => {
        return this.characterService.bloodlineRank >= 3;
      },
      effect: () => {
        if (this.inventoryService.heirloomSlots() < 1) {
          this.inventoryService.heirloomSlots.set(1);
        }
      },
      unlocked: false,
    },
    {
      name: 'Mine Forever',
      description:
        'Your descendants have so much respect for you that they will preserve three stacks of items for your next reincarnation.',
      hint: 'Strong family bonds have advantages.',
      check: () => {
        return this.characterService.bloodlineRank >= 5;
      },
      effect: () => {
        if (this.inventoryService.heirloomSlots() < 3) {
          this.inventoryService.heirloomSlots.set(3);
        }
      },
      unlocked: false,
    },
    {
      name: 'Eternal Nation',
      description: 'You have established an empire that will never fall, and a bloodline that will always inherit it.',
      hint: 'Bloodline Empire.',
      check: () => {
        return this.homeService.home.type >= HomeType.Capital && this.characterService.bloodlineRank >= 7;
      },
      effect: () => {
        this.characterService.imperial = true;
      },
      unlocked: false,
    },
    {
      name: 'Limit Breaker',
      description: 'You have broken past human limits and improve constantly! What new fate awaits you?',
      hint: '999',
      check: () => {
        return this.characterService.bloodlineRank >= 9;
      },
      effect: () => {
        /* intentionally empty */
      },
      unlocked: false,
    },
    {
      name: 'Harmony of Mind and Body',
      description:
        'You have balanced your powerful mind and body and unlocked the ability to use your Qi to strike down your enemies.',
      hint: 'The dao embraces all things in perfect harmony.',
      check: () => {
        const speed = this.characterService.attributes.speed.value;
        const toughness = this.characterService.attributes.toughness.value;
        const charisma = this.characterService.attributes.charisma.value;
        const intelligence = this.characterService.attributes.intelligence.value;
        const strength = this.characterService.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.battleService.addQiAttack();
      },
      unlocked: false,
    },
    {
      name: 'Unity of Spirit, Mind, and Body',
      description:
        'You have balanced your powerful spirit with your mind and body.<br>You unlocked the ability to use your Qi to protect yourself.',
      hint: 'The dao embraces all things in perfect harmony.',
      check: () => {
        const spirituality = this.characterService.attributes.spirituality.value;
        const speed = this.characterService.attributes.speed.value;
        const toughness = this.characterService.attributes.toughness.value;
        const charisma = this.characterService.attributes.charisma.value;
        const intelligence = this.characterService.attributes.intelligence.value;
        const strength = this.characterService.attributes.strength.value; //Reduce the bulk

        const lowValue = Math.min(speed, toughness, charisma, intelligence, strength, spirituality);
        const highValue = Math.max(speed, toughness, charisma, intelligence, strength, spirituality);
        return lowValue >= 1000000 && highValue <= lowValue * 1.21; // 1.1 * 1.1 = 1.21
      },
      effect: () => {
        this.battleService.addQiShield();
      },
      unlocked: false,
    },
    {
      name: 'Disposable Followers',
      description:
        'You have recruited so many people you can now freely dismiss followers using the ' +
        this.itemRepoService.items['followerAutoDismissManual'].name,
      hint: 'The One Hundred Companions.',
      check: () => {
        return this.followerService.followersRecruited >= 100;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['followerAutoDismissManual']);
      },
      unlocked: false,
    },
    {
      name: 'Loyal Followers',
      description:
        "One of your followers has trained under you so long they have nothing else to learn.<br>In an epiphany you realized how to double your new followers' lifespan.",
      hint: 'Endless training.',
      check: () => {
        return this.followerService.highestLevel >= 100;
      },
      effect: () => {
        this.followerService.followerLifespanDoubled = true;
      },
      unlocked: false,
    },
    {
      name: 'Ascension',
      description: 'You have developed enough spirituality to ascend.',
      hint: 'Only with spiritual development can you ascend to higher states.',
      check: () => {
        return this.characterService.attributes.spirituality.value >= 10;
      },
      effect: () => {
        this.characterService.ascensionUnlocked = true;
      },
      unlocked: false,
    },
    {
      name: "I don't want to go.",
      description:
        'You have lived many lives and unlocked the ' + this.itemRepoService.items['autoPauseSettingsManual'].name,
      hint: "Just keep playing. I'm sure this will come to an aspiring immortal eventually.",
      check: () => {
        return this.characterService.totalLives >= 48 && this.mainLoopService.totalTicks > 18250;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoPauseSettingsManual']);
      },
      unlocked: false,
    },
    {
      name: 'Breaks are Good',
      description:
        "You have collected two hour's worth of banked time and unlocked the " +
        this.itemRepoService.items['bankedTicksEfficiencyManual'].name,
      hint: 'Take a day off from cultivating.', //it takes 20h to get
      check: () => {
        return this.mainLoopService.bankedTicks > 2 * 60 * 60 * 40; //there are 40 ticks a second
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['bankedTicksEfficiencyManual']);
      },
      unlocked: false,
    },
    {
      name: 'Breaks are Bad',
      description:
        'You died from overwork performing an activity without necessary rest and unlocked the ' +
        this.itemRepoService.items['autoRestManual'].name,
      hint: "There's no time to rest, cultivating is life.",
      check: () => {
        return this.activityService.activityDeath || this.characterService.immortal();
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['autoRestManual']);
      },
      unlocked: false,
    },
    {
      name: 'Still Spry',
      description:
        'You have lived to be 300 years old and unlocked the ' + this.itemRepoService.items['ageSpeedManual'].name,
      hint: 'One step to becoming immortal is to live longer.',
      check: () => {
        return this.characterService.age > 300 * 365;
      },
      effect: () => {
        this.storeService.unlockManual(this.itemRepoService.items['ageSpeedManual']);
      },
      unlocked: false,
    },
    {
      name: 'Immortality',
      description: 'Congratulations! You are now immortal.',
      hint: 'Name of the game.',
      check: () => {
        return this.characterService.immortal();
      },
      effect: () => {
        if (!this.unlockedMemories.includes(MEMORY_IMMORTALITY)) {
          this.triggerMemory(MEMORY_IMMORTALITY);
        }
        this.activityService.checkRequirements(true);
      },
      unlocked: false,
    },
    {
      name: 'Headhunter',
      description: "You've sorted through so many applicants that you can now always find followers you want.",
      hint: "You didn't really want one thousand scouts, did you?",
      check: () => {
        return this.followerService.totalDismissed > 888;
      },
      effect: () => {
        this.followerService.onlyWantedFollowers = true;
      },
      unlocked: false,
    },
    {
      name: 'Yes We Can!',
      description: 'You found Bob the Builder.',
      hint: 'Can we fix it?',
      check: () => {
        for (const follower of this.followerService.followers) {
          if ((follower.name === 'Robert' || follower.name === 'Bob') && follower.job === 'builder') {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'The Old Soulsmith',
      description: "She's retired from soulsmithing and just goes fishing now. Also, go reread Cradle.",
      hint: "Lindon's soulsmithing tutor.",
      check: () => {
        for (const follower of this.followerService.followers) {
          if (follower.name === 'Gesha' && follower.job === 'fisher') {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: "They're Grrrrreat",
      description: 'You have made an animal friend who can provide you with a tasty breakfast.',
      hint: "You'll need to find a very special pet.",
      check: () => {
        for (const follower of this.followerService.pets) {
          if ((follower.name === 'Tony' || follower.name === 'Antonio') && follower.job === 'tiger') {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: "Don't mess with Grandma",
      description: 'You have crafted the mightiest stick.<br>Grandmother would be so proud.',
      hint: 'The best stick.',
      check: () => {
        if (this.characterService.equipment.leftHand?.name === "Grandmother's Walking Stick") {
          if ((this.characterService.equipment.leftHand.weaponStats?.baseDamage || 0) > 1e9) {
            return true;
          }
        }
        return false;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'Smooth Farming',
      description:
        'You have harvested crops every day for a month and can now count on more regular and reliable harvests.',
      hint: 'Farm-fresh produce every day would be lovely.',
      check: () => {
        return this.farmService.smoothFarming;
      },
      effect: () => {
        // the reward is already received in the smoothFarming variable.
        // Did this one differently due to the risk of qualifying for the achievement then losing it before the check tick fired.
      },
      unlocked: false,
    },
    {
      name: 'The Pain Begins',
      description: 'You have begun to work your way through hell.',
      hint: 'You are not ready.',
      check: () => {
        return this.hellService.inHell();
      },
      effect: () => {
        this.gameStateService?.unlockPanel('hellStatusPanel');
        this.gameStateService!.addLayoutPanel('hellStatusPanel', 0, 14, 30, 14);
        this.gameStateService?.unlockPanel('portalPanel');
        this.gameStateService!.addLayoutPanel('portalPanel', 0, 14, 30, 14);
      },
      unlocked: false,
    },
    {
      name: 'Let It Burn',
      description: 'You have burned an insane amount of money.',
      hint: "You didn't want that money anyway.",
      check: () => {
        return this.hellService.burnedMoney > 1e9;
      },
      effect: () => {
        this.hellService.fasterHellMoney = true;
      },
      unlocked: false,
    },
    {
      name: 'Peaches Peaches Peaches',
      description: "They're so good, you just want to drink them down.",
      hint: 'There is more alchemy to learn.',
      check: () => {
        return this.inventoryService.divinePeachesUnlocked;
      },
      effect: () => {
        if (this.characterService.itemPouches.length < 3) {
          // open up an item pouch slot if one isn't open yet
          this.characterService.itemPouches.push(this.inventoryService.getEmptyItemStack());
        }
      },
      unlocked: false,
    },
    {
      name: 'Deity',
      description:
        'You have conquered the trials of the eighteen hells and emerged as worthy to claim a throne in the Divine Realm.',
      hint: 'Godhood awaits you.',
      check: () => {
        return this.characterService.god();
      },
      effect: () => {
        if (!this.unlockedMemories.includes(MEMORY_HELL_COMPLETION)) {
          this.triggerMemory(MEMORY_HELL_COMPLETION);
        }
      },
      unlocked: false,
    },
    {
      name: 'You Like Me!',
      description: 'You clicked the credits button. Hurray!',
      hint: 'Who made this thing?',
      check: () => {
        return this.gameStateService!.creditsClicked;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'You Really Like Me!',
      description: 'You clicked the support link and saw my first book. Thanks!',
      hint: 'Do you really, really?',
      check: () => {
        return this.gameStateService!.supportClicked;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'Going Meta',
      description: 'You earned 50 achievements. Good job!',
      hint: 'Can you get one for having lots?',
      check: () => {
        return this.unlockAchievement.length >= 50;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
    {
      name: 'Meta Meta',
      description: 'You earned 100 achievements. Good job!',
      hint: 'Can you get more for having more?',
      check: () => {
        return this.unlockAchievement.length >= 100;
      },
      effect: () => {
        // no effect, it's just for fun
      },
      unlocked: false,
    },
  ];

  unlockAchievement(achievement: Achievement, newAchievement: boolean) {
    if (newAchievement) {
      this.unlockedAchievements.push(achievement.name);
      this.logService.log(LogTopic.STORY, achievement.description);
      // check if gameStateService is injected yet, if not, inject it (circular dependency issues)
      this.characterService.toast(
        'Achievement Unlocked: ' + (achievement.displayName ? achievement.displayName : achievement.name)
      );
    }
    achievement.effect();
    achievement.unlocked = true;
    if (newAchievement) {
      this.gameStateService?.savetoLocalStorage();
    }
  }

  triggerMemory(memoryName: string, triggerFunction: (() => void) | null = null) {
    const memory = this.memories[memoryName];
    const imageFiles = [];
    for (let i = 0; i < memory.text.length; i++) {
      imageFiles.push('assets/images/memories/' + memory.imageBaseName + i + '.png');
    }

    const dialogRef = this.dialog.open(TextPanelComponent, {
      width: '700px',
      data: { titleText: memory.title, bodyTextArray: memory.text, imageFiles: imageFiles },
      autoFocus: false,
    });
    if (triggerFunction) {
      dialogRef.afterClosed().subscribe(triggerFunction);
    }
    if (!this.unlockedMemories.includes(memoryName)) {
      this.unlockedMemories.push(memoryName);
      this.memoriesUnlocked.set(true);
    }
  }

  reviewMemories() {
    this.dialog.open(MemoriesPanelComponent, {
      data: {},
      autoFocus: false,
    });
  }

  getProperties(): AchievementProperties {
    return {
      unlockedAchievements: this.unlockedAchievements,
      unlockedMemories: this.unlockedMemories,
    };
  }

  setProperties(properties: AchievementProperties) {
    if (!this.gameStateService) {
      this.gameStateService = this.injector.get(GameStateService);
    }
    this.unlockedMemories = properties.unlockedMemories;
    if (this.unlockedMemories.length > 0) {
      this.memoriesUnlocked.set(true);
    }
    this.unlockedAchievements = properties.unlockedAchievements;
    for (const achievement of this.achievements) {
      if (this.unlockedAchievements.includes(achievement.name)) {
        this.unlockAchievement(achievement, false);
      }
    }
  }
}
