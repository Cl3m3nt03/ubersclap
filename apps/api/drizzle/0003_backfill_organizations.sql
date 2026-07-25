-- Rattrapage : donner une organisation et un abonnement aux comptes anterieurs
-- a ADR-015.
--
-- Depuis la migration 0001, `register` cree les trois lignes ensemble. Les
-- comptes crees AVANT n'ont ni organisation, ni appartenance, ni abonnement :
-- l'ecran Abonnement leur repond 404 et aucun tier n'est lisible. Le code gere
-- deja ce cas sans casser (nullable cote /me, 404 cote billing), mais ne pas
-- casser ne veut pas dire utilisable — ces comptes ne peuvent pas s'abonner.
--
-- On applique exactement la regle de l'inscription : une personne = une
-- organisation dont elle est ADMIN, en SOLO / TRIALING.
--
-- `gen_random_uuid()` (v4) plutot que les UUID v7 du code applicatif : ces
-- tables ne sont jamais triees par identifiant, et un v7 n'est pas generable en
-- SQL pur. Aucune consequence fonctionnelle ici.

INSERT INTO organizations (id, name, owner_user_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  -- Meme libelle qu'a l'inscription : prenom + nom.
  trim(u.first_name || ' ' || u.last_name),
  u.id,
  u.created_at,
  now()
FROM users u
WHERE u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM organization_memberships m WHERE m.user_id = u.id
  );
--> statement-breakpoint

INSERT INTO organization_memberships (id, organization_id, user_id, role, created_at)
SELECT gen_random_uuid(), o.id, o.owner_user_id, 'ADMIN', o.created_at
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_memberships m WHERE m.organization_id = o.id
);
--> statement-breakpoint

INSERT INTO subscriptions (id, organization_id, tier, status, created_at, updated_at)
SELECT gen_random_uuid(), o.id, 'SOLO', 'TRIALING', o.created_at, now()
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.organization_id = o.id
);
