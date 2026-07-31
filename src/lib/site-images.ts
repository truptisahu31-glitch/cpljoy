import { useMemo } from "react";

import { crowdFrames, deals, heroSlides, players, site } from "@/content/site.config";
import { assetUrl, imageOr, itemsFor, type ContentItem } from "./site-content";
import { useSiteContent } from "./use-site-content";

/* ---------------------------------------------------------------------------
   Every photograph on the landing page, resolved once.

   Two override styles, chosen per slot by what the admin is actually doing:

   - Wholesale (hero, crowd): uploading any frame replaces the bundled set.
     These are sequences — mixing three uploads with two bundled shots gives an
     incoherent run, so the admin owns all or none.
   - Per item (deals, mockups): each upload is labelled with the deal or tab it
     belongs to, so replacing one leaves the rest bundled. These are captioned
     to specific content; a partial swap is exactly what the admin wants.
   --------------------------------------------------------------------------- */

type Frame = { src: string; alt: string };

/** Map a repeatable slot to frames, keeping the bundled set if none uploaded. */
function framesOr(items: ContentItem[], slot: "heroCarousel" | "crowdFrame", fallback: Frame[]) {
  const uploaded = itemsFor(items, slot);
  if (!uploaded.length) return fallback;
  return uploaded.map((i) => ({ src: assetUrl(i.src), alt: i.alt || "" }));
}

export function useSiteImages() {
  const content = useSiteContent();

  return useMemo(() => {
    const heroUploaded = itemsFor(content, "heroCarousel");
    const hero = heroUploaded.length
      ? heroUploaded.map((i, n) => ({
          src: assetUrl(i.src),
          alt: i.alt || "",
          // Framing and caption are editorial, not part of the upload, so an
          // uploaded frame inherits them from the slide it stands in for.
          focal: heroSlides[n % heroSlides.length].focal,
          venue: i.text || heroSlides[n % heroSlides.length].venue,
        }))
      : heroSlides;

    return {
      heroSlides: hero,
      crowdFrames: framesOr(content, "crowdFrame", crowdFrames),
      ctaBackground: imageOr(content, "finalCtaBackdrop", site.ctaBackground),
      playerImage: imageOr(content, "playerCutout", players[0].image),
      deals: deals.map((d) => ({ ...d, image: imageOr(content, "dealImage", d.image, d.id) })),
    };
  }, [content]);
}
