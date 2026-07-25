import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { createRequire } from 'node:module';

/**
 * Demarre Metro en annoncant l'adresse LAN de ce poste.
 *
 * Expo choisit seul l'adresse qu'il inscrit dans le QR code. Sur un poste avec
 * un VPN (NordLynx) ou WSL, sa detection tombe a cote : elle a renvoye
 * `127.0.0.1` ici, ce qui envoie le telephone chercher le bundle chez lui —
 * Expo Go affiche « there was a problem running the requested app » avant que
 * la moindre ligne de l'app ne tourne.
 *
 * L'adresse est donc calculee ici et imposee par `EXPO_PACKAGER_HOSTNAME`. Elle
 * est recalculee a chaque demarrage plutot qu'ecrite en dur : le bail DHCP
 * change, et une adresse figee marcherait un soir puis plus jamais.
 *
 * Elle sert deux fois : au telechargement du bundle, et a joindre l'API — voir
 * `lib/config.ts`, qui deduit l'URL du serveur de ce meme hote.
 */

/** Interfaces a ignorer : elles ont une IP valide mais injoignable du telephone. */
const IGNORED = /nordlynx|wsl|vethernet|virtualbox|vmware|docker|loopback|tailscale|zerotier/i;

function lanAddress() {
  const candidates = [];

  for (const [name, addresses] of Object.entries(networkInterfaces())) {
    if (IGNORED.test(name)) continue;

    for (const address of addresses ?? []) {
      if (address.family !== 'IPv4' || address.internal) continue;
      candidates.push({ name, ip: address.address });
    }
  }

  // Un reseau domestique est en 192.168.x — on le prefere aux plages qu'un VPN
  // ou un conteneur utilise aussi (10.x, 172.16–31.x).
  const preferred = candidates.find((c) => c.ip.startsWith('192.168.'));
  return preferred ?? candidates[0] ?? null;
}

const found = lanAddress();

if (!found) {
  console.error(
    'Aucune adresse LAN trouvee. Connecte le poste au Wi-Fi, ou lance `pnpm start` ' +
      'si tu vises un simulateur local.',
  );
  process.exit(1);
}

console.log(`Metro annonce ${found.ip} (interface « ${found.name} »).`);
console.log(`Le telephone doit etre sur le MEME reseau Wi-Fi.\n`);

/**
 * On lance le CLI d'Expo avec le Node courant, sans passer par `npx`.
 *
 * Windows refuse de lancer un `.cmd` sans shell (EINVAL sur Node 20+), et
 * `shell: true` concatene les arguments sans les echapper (DEP0190). Resoudre
 * le script evite les deux.
 */
const expoCli = createRequire(import.meta.url).resolve('expo/bin/cli');

const child = spawn(
  process.execPath,
  [expoCli, 'start', '--host', 'lan', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PACKAGER_HOSTNAME: found.ip,
      // Meme hote pour l'API : sans ca `lib/config.ts` retombe sur localhost,
      // qui depuis le telephone designe le telephone.
      EXPO_PUBLIC_API_URL:
        process.env.EXPO_PUBLIC_API_URL ?? `http://${found.ip}:3000/v1`,
    },
  },
);

child.on('exit', (code) => process.exit(code ?? 0));
