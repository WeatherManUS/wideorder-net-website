import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/components/site-pages";
import { siteContent } from "@/content/home";
import { buildPageMetadata, siteConfig } from "@/config/site";

export const dynamicParams = false;
export function generateStaticParams() { return siteContent.ourWork.stories.map((story) => ({ slug: story.id })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const story = siteContent.ourWork.stories.find((entry) => entry.id === slug);
  if (!story) notFound();
  return buildPageMetadata({ title: `${story.title}: ${story.result}`, description: story.summary, path: `/our-work/${story.id}` });
}
export default async function CaseStudy({ params }: Props) {
  const { slug } = await params;
  const story = siteContent.ourWork.stories.find((entry) => entry.id === slug);
  if (!story) notFound();
  const url = `${siteConfig.domain}/our-work/${story.id}`;
  const structuredData = { "@context": "https://schema.org", "@type": "Article", headline: story.title, description: story.summary,
    mainEntityOfPage: url, image: `${siteConfig.domain}/social/${story.id}.png`, publisher: { "@id": `${siteConfig.domain}/#organization` } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><CaseStudyPage story={story} /></>;
}
