---

## `docs/checkout.md`

```md
# Checkout — Stripe piloté par BFF (source de vérité)

## 1) Principes non négociables
- Le Front n’effectue **aucun** calcul de prix final.
- Le checkout est **piloté par le BFF**.
- Le webhook BFF fait foi : l’état final = BFF.
- Les endpoints checkout sont en `no-store`.

## 2) Panier (Zustand) : “brouillon”
- Persist localStorage (Zustand persist)
- Totaux côté Front = indicatifs seulement
- Clear cart uniquement si `PAID` confirmé par status BFF

## 3) Création de session checkout
### Payload minimal (Front → BFF)
```json
[
  { "productId": "prod_001", "quantity": 1 },
  { "productId": "prod_002", "quantity": 2 }
]
Règles
Jamais price, email, address dans payload.

POST /checkout/session en cache: 'no-store'

Réponse attendue : { checkoutUrl }

Redirect browser vers checkoutUrl

4) Statuts de checkout (page success)
Le Front lit session_id (query param Stripe)

Polling GET /checkout/status?session_id=... via TanStack Query

Polling toutes les 2s tant que LOCKED

Timeout logique (staleTime) 60s + retries

Mapping statuts
DRAFT → loading

LOCKED → loading + note “confirmation en cours”

PAID → succès + clear cart

CANCELLED → erreur “annulé”

EXPIRED → erreur “expirée”

FAILED → erreur “échec”

5) Sécurité & cache
checkout/session : no-store

checkout/status : no-store

Pas de données sensibles en URL hors session_id

6) Check stock (optionnel)
GET /catalog/products/:id/stock en no-store

Si erreur : fallback permissif (ajout quand même), logging console.

7) Checklist Checkout (agent)
 Payload minimal IDs + quantités

 no-store sur session + status

 Polling stoppé dès statut final

 Clear cart uniquement si PAID

 UI couvre tous statuts (y compris missing session_id)
