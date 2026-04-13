import { useRef, useCallback } from 'react';

const COOLDOWN_MS = 8000;

const VOICE_MESSAGES: Record<string, string> = {
  // Firearms (Critical)
  'gun': 'Critical alert! A firearm has been detected. Immediate action required.',
  'pistol': 'Critical alert! A pistol has been detected. Immediate action required.',
  'revolver': 'Critical alert! A revolver has been detected. Immediate action required.',
  'rifle': 'Critical alert! A rifle has been detected. Immediate action required.',
  'shotgun': 'Critical alert! A shotgun has been detected. Immediate action required.',
  'firearm': 'Critical alert! A firearm has been detected. Immediate action required.',

  // Large blades (Critical)
  'knife': 'Critical alert! A knife has been detected.',
  'sword': 'Critical alert! A sword has been detected.',
  'machete': 'Critical alert! A machete has been detected.',
  'dagger': 'Critical alert! A dagger has been detected.',
  'cleaver': 'Critical alert! A cleaver has been detected.',

  // Explosives (Critical)
  'explosive': 'Critical alert! A suspected explosive device has been detected. Evacuate immediately.',
  'bomb': 'Critical alert! A suspected bomb has been detected. Evacuate immediately.',
  'ied': 'Critical alert! A suspected improvised explosive device detected. Evacuate immediately.',

  // Chemical (Critical)
  'acid': 'Critical alert! A suspected acid bottle has been detected.',
  'chemical': 'Critical alert! A suspicious chemical container has been detected.',

  // Sharp objects (High)
  'scissors': 'Warning! A person with scissors has been detected.',
  'box cutter': 'Warning! A box cutter has been detected.',
  'razor': 'Warning! A razor blade has been detected.',
  'broken bottle': 'Warning! A broken bottle being used as weapon detected.',
  'broken glass': 'Warning! Broken glass being wielded as weapon detected.',

  // Blunt weapons (High)
  'baseball bat': 'Warning! A person with a bat has been detected.',
  'bat': 'Warning! A person carrying a bat has been detected.',
  'metal rod': 'Warning! A person carrying a metal rod has been detected.',
  'iron pipe': 'Warning! A person carrying an iron pipe has been detected.',
  'chain': 'Warning! A person carrying a chain has been detected.',
  'club': 'Warning! A person carrying a blunt weapon has been detected.',
  'hammer': 'Warning! A person aggressively wielding a hammer has been detected.',
  'brick': 'Warning! A person holding a brick to throw has been detected.',
  'rock': 'Warning! A person holding a rock to throw has been detected.',

  // Other weapons (High)
  'syringe': 'Warning! A syringe has been detected.',
  'pepper spray': 'Warning! Pepper spray has been detected.',
  'taser': 'Warning! A taser or stun gun has been detected.',
  'bottle': 'Warning! A suspicious bottle has been detected.',

  // Suspicious behaviors (Medium)
  'face_hidden': 'Alert! A person hiding their face has been detected. Possible threat.',
  'balaclava': 'Alert! A person wearing a balaclava has been detected.',
  'mask_suspicious': 'Alert! A person wearing a suspicious face covering has been detected.',
  'concealed_object': 'Warning! A person concealing an object under clothing has been detected.',
  'aggressive_posture': 'Warning! Aggressive behavior or fighting detected.',
  'fighting': 'Warning! Physical fighting detected between people. Security response needed.',
  'erratic_movement': 'Warning! A person running erratically from the scene.',
  'unattended_bag': 'Alert! An unattended bag or package has been detected. Do not approach.',
  'climbing': 'Warning! A person is attempting to climb security barriers.',
  'intrusion': 'Warning! Unauthorized intrusion attempt detected.',
  'suspicious_photography': 'Alert! A person is systematically photographing security infrastructure.',
  'intimidation': 'Warning! A group is surrounding and intimidating a person.',
  'crouching': 'Alert! A person is hiding and watching the crowd suspiciously.',
};

export function useThreatVoiceAlert() {
  const lastSpokenRef = useRef<Record<string, number>>({});

  const speak = useCallback((text: string, key: string) => {
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    const lastTime = lastSpokenRef.current[key] || 0;
    if (now - lastTime < COOLDOWN_MS) return;
    lastSpokenRef.current[key] = now;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
  }, []);

  const announceTheat = useCallback((objectName: string, description?: string) => {
    const normalized = objectName.toLowerCase().trim();

    // Direct match
    const directMessage = VOICE_MESSAGES[normalized];
    if (directMessage) {
      speak(directMessage, normalized);
      return;
    }

    // Partial match
    for (const [key, msg] of Object.entries(VOICE_MESSAGES)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        speak(msg, key);
        return;
      }
    }

    // Behavior pattern matching from description
    if (description) {
      const desc = description.toLowerCase();
      const patterns: [string[], string][] = [
        [['hiding face', 'balaclava', 'ski mask', 'face covered', 'face hidden'], 'face_hidden'],
        [['concealing', 'hidden object', 'bulge', 'under clothing'], 'concealed_object'],
        [['fighting', 'punching', 'kicking', 'assault', 'attack'], 'fighting'],
        [['aggressive', 'threatening'], 'aggressive_posture'],
        [['running away', 'fleeing', 'erratic'], 'erratic_movement'],
        [['unattended', 'abandoned', 'left behind'], 'unattended_bag'],
        [['climb', 'fence', 'barrier', 'jump over'], 'climbing'],
        [['intrusion', 'restricted', 'unauthorized'], 'intrusion'],
        [['photograph', 'camera', 'security infrastructure', 'surveilling'], 'suspicious_photography'],
        [['surround', 'intimidat', 'gang'], 'intimidation'],
        [['crouch', 'hiding', 'watching'], 'crouching'],
      ];

      for (const [keywords, key] of patterns) {
        if (keywords.some(k => desc.includes(k))) {
          speak(VOICE_MESSAGES[key], key);
          return;
        }
      }

      // Generic fallback
      speak(`Security alert! ${description}`, 'generic_' + normalized);
    } else {
      speak(`Security alert! ${objectName} has been detected.`, 'generic_' + normalized);
    }
  }, [speak]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { announceTheat, stopSpeaking };
}
