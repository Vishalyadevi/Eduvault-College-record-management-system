import TlpComment from '../../models/student/TlpComment.js';
import TlpActivity from '../../models/student/TlpActivity.js';

// Profanity and violent/abusive phrase detection
// Keep this list conservative and extend as required.
const PROFANITY_WORDS = [
  'badword1',
  'badword2',
  'offensive',
  'stupid',
  'idiot',
  'dumb'
];

const VIOLENT_VERBS = ['kill', 'murder', 'destroy', 'smash', 'beat', 'hurt', 'attack', 'bomb'];
const TARGET_PRONOUNS = ['you', 'your', 'him', 'her', 'them', 'they'];

const containsProfanity = (text) => {
  if (!text) return false;
  const clean = text.toLowerCase().replace(/[\p{P}$+<=>^`|~]/gu, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  // direct word match
  for (const w of words) {
    if (PROFANITY_WORDS.includes(w)) return true;
  }

  // check for violent verb + target (e.g., "kill you", "i will kill you") within small window
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (VIOLENT_VERBS.includes(w)) {
      // look ahead a few words for a pronoun/target
      for (let j = i + 1; j <= i + 4 && j < words.length; j++) {
        if (TARGET_PRONOUNS.includes(words[j])) return true;
      }
      // look behind for pronoun before verb (e.g., "you kill")
      for (let j = i - 1; j >= i - 3 && j >= 0; j--) {
        if (TARGET_PRONOUNS.includes(words[j])) return true;
      }
    }
  }

  return false;
};

export const getCommentsForTlp = async (req, res) => {
  try {
    const { id } = req.params;
    const tlp = await TlpActivity.findByPk(id);
    if (!tlp) return res.status(404).json({ message: 'TLP not found' });

    const comments = await TlpComment.findAll({ where: { tlpActivityId: id, is_visible: true }, order: [['created_at', 'ASC']] });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

export const postCommentForTlp = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content } = req.body;

    const tlp = await TlpActivity.findByPk(id);
    if (!tlp) return res.status(404).json({ message: 'TLP not found' });

    if (!content || content.trim().length === 0) return res.status(400).json({ message: 'Comment content required' });

    const hasProfanity = containsProfanity(content);

    const comment = await TlpComment.create({
      tlpActivityId: id,
      Userid: req.user?.Userid || null,
      name: name || (req.user?.name) || 'Anonymous',
      content,
      is_visible: !hasProfanity,
    });

    if (hasProfanity) {
      return res.status(201).json({ message: 'Comment submitted and queued for moderation', comment });
    }

    res.status(201).json({ message: 'Comment posted', comment });
  } catch (error) {
    console.error('Error posting comment', error);
    res.status(500).json({ message: 'Error posting comment', error: error.message });
  }
};

export default { getCommentsForTlp, postCommentForTlp };
