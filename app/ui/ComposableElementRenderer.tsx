import CommonTrustedBy from "@/app/ui/CommonTrustedBy";
import HomeServices from "@/app/ui/HomeServices";
import HomeAI from "@/app/ui/HomeAI";
import HomeProducts from "@/app/ui/ProductsCarousel";
import HomeTalkToUs from "@/app/ui/HomeTalkToUs";
import HomeAboutUs from "@/app/ui/HomeAboutUs";
import HomeCaseStudies from "@/app/ui/HomeCaseStudies";
import CaseStudiesListing from "@/app/ui/CaseStudiesListing";
import CaseStudyDetailSection from "@/app/ui/CaseStudyDetailSection";
import Home404 from "@/app/ui/Home404";
import ServicesPage from "@/app/ui/ServicesPage";
import ServicesAiLayer from "@/app/ui/ServicesAiLayer";
import AboutHero from "@/app/ui/AboutHero";
import AboutStats from "@/app/ui/AboutStats";
import AboutStory from "@/app/ui/AboutStory";
import AboutServices from "@/app/ui/AboutServices";
import AboutApproach from "@/app/ui/AboutApproach";
import AboutProducts from "@/app/ui/AboutProducts";
import AboutLeadership from "@/app/ui/AboutLeadership";
import AboutCulture from "@/app/ui/AboutCulture";
import AboutGlobal from "@/app/ui/AboutGlobal";
import AboutMissionVision from "@/app/ui/AboutMissionVision";
import AboutWhy from "@/app/ui/AboutWhy";
import ContactHero from "@/app/ui/ContactHero";
import ContactInfoCards from "@/app/ui/ContactInfoCards";
import ContactForm from "@/app/ui/ContactForm";
import ContactStats from "@/app/ui/ContactStats";
import ContactProcess from "@/app/ui/ContactProcess";
import ContactFaq from "@/app/ui/ContactFaq";
import ProductsHero from "@/app/ui/ProductsHero";
import ProductShowcase from "@/app/ui/ProductShowcase";
import ProductCompare from "@/app/ui/ProductCompare";
import ProductTech from "@/app/ui/ProductTech";
import ProductPhilosophy from "@/app/ui/ProductPhilosophy";
import ProductRoadmap from "@/app/ui/ProductRoadmap";
import AISolutionsHero from "@/app/ui/AISolutionsHero";
import AISolutionsCapabilities from "@/app/ui/AISolutionsCapabilities";
import AISolutionsDifferentiators from "@/app/ui/AISolutionsDifferentiators";
import AISolutionsProcess from "@/app/ui/AISolutionsProcess";
import AISolutionsSpotlight from "@/app/ui/AISolutionsSpotlight";
import AISolutionsTechStack from "@/app/ui/AISolutionsTechStack";
import CareersPage from "@/app/ui/CareersPage";
import CareersBannerHorizon from "@/app/ui/CareersBannerHorizon";
import ServiceDetailHero from "@/app/ui/ServiceDetailHero";
import ServiceDetailProof from "@/app/ui/ServiceDetailProof";
import ServiceDetailOthers from "@/app/ui/ServiceDetailOthers";
import LegalPage from "@/app/ui/LegalPage";
import LandingHero from "@/app/ui/LandingHero";
import LandingProcess from "@/app/ui/LandingProcess";
import LandingCards from "@/app/ui/LandingCards";
import LandingIndustries from "@/app/ui/LandingIndustries";
import LandingTimeline from "@/app/ui/LandingTimeline";
import LandingTestimonials from "@/app/ui/LandingTestimonials";
import LandingExplore from "@/app/ui/LandingExplore";
import LandingFaq from "@/app/ui/LandingFaq";
import LandingInsights from "@/app/ui/LandingInsights";
import DigitalCommerce from "@/app/ui/DigitalCommerce/DigitalCommerce";
import { Entry, EntrySkeletonType } from "contentful";
import { ComposableElementSkeleton } from "../types/contentful";
import { resolveNavContrast } from "../lib/navContrast";
import DigitalStrategyPage from "./DigitalCommerce/DigitalStrategyPage";
import UiExperiencePage from "./DigitalCommerce/UiExperiencePage";
import SoftwareDevelopmentPage from "./DigitalCommerce/SoftwareDevelopmentPage";
import CloudDigitaPage from "./DigitalCommerce/CloudDigitaPage";
import EnterpriseSystemPage from "./DigitalCommerce/EnterpriseSystemPage";
import DigitalCommercePage from "./DigitalCommerce/DigitalCommercePage";
import AgenticEngineeringPage from "./DigitalCommerce/AgenticEngineeringPage";
import SamVaultCaseStudy from "./product/SamVaultCaseStudy";
import ActionPulseCaseStudy from "./product/ActionPulseCaseStudy";
import ForgePipelineCaseStudy from "./product/ForgePipelineCaseStudy";
import KollabryCaseStudy from "./product/KollabryCaseStudy";

type PlainEntry<Skeleton extends EntrySkeletonType> = Entry<
  Skeleton,
  undefined
>;

interface Props {
  entry: PlainEntry<ComposableElementSkeleton>;
}

type RendererProps = {
  entry: PlainEntry<ComposableElementSkeleton>;
};

const subtypeComponents: Record<
  string,
  React.ComponentType<RendererProps>
> = {
  client: CommonTrustedBy,
  service: HomeServices,
  ai: HomeAI,
  producthome: HomeProducts,
  talktous: HomeTalkToUs,
  aboutus: HomeAboutUs,
  casestudy: HomeCaseStudies,
  caseStudiesListing: CaseStudiesListing,
  caseStudyDetail: CaseStudyDetailSection,
  notfound: Home404,
  servicesPage: ServicesPage,
  servicesAiLayer: ServicesAiLayer,
  aboutHero: AboutHero,
  aboutStats: AboutStats,
  aboutStory: AboutStory,
  aboutServices: AboutServices,
  aboutApproach: AboutApproach,
  aboutProducts: AboutProducts,
  aboutLeadership: AboutLeadership,
  aboutCulture: AboutCulture,
  aboutGlobal: AboutGlobal,
  aboutMissionVision: AboutMissionVision,
  aboutWhy: AboutWhy,
  contactHero: ContactHero,
  contactInfo: ContactInfoCards,
  contactForm: ContactForm,
  contactStats: ContactStats,
  contactProcess: ContactProcess,
  contactFaq: ContactFaq,
  productsHero: ProductsHero,
  productShowcase: ProductShowcase,
  productCompare: ProductCompare,
  productTech: ProductTech,
  productPhilosophy: ProductPhilosophy,
  productRoadmap: ProductRoadmap,
  aiHero: AISolutionsHero,
  aiCapabilities: AISolutionsCapabilities,
  aiDifferentiators: AISolutionsDifferentiators,
  aiProcess: AISolutionsProcess,
  aiSpotlight: AISolutionsSpotlight,
  aiTechStack: AISolutionsTechStack,
  careersPage: CareersPage,
  careersBanner: CareersBannerHorizon,
  serviceHero: ServiceDetailHero,
  serviceProof: ServiceDetailProof,
  serviceOthers: ServiceDetailOthers,
  legalPage: LegalPage,
  landingHero: LandingHero,
  landingProcess: LandingProcess,
  landingCards: LandingCards,
  landingIndustries: LandingIndustries,
  landingTimeline: LandingTimeline,
  landingTestimonials: LandingTestimonials,
  landingTeam: AboutLeadership,
  landingExplore: LandingExplore,
  landingFaq: LandingFaq,
  landingInsights: LandingInsights,
  digitalStrategy: DigitalStrategyPage,
  uiExperience: UiExperiencePage,
  softwareDevelopment: SoftwareDevelopmentPage,
  cloudDigital: CloudDigitaPage,
  enterpriseSystem: EnterpriseSystemPage,
  digitalCommerce: DigitalCommercePage,
  agenticEngineering: AgenticEngineeringPage,
  samVaultProduct: SamVaultCaseStudy,
  actionPulse: ActionPulseCaseStudy,
  forgePipeline: ForgePipelineCaseStudy,
  kollabry: KollabryCaseStudy,
  DigitalCommerceHero: DigitalCommerce,
};

export default function ComposableElementRenderer({
  entry,
}: Props) {
  const subType = entry.fields.subType;

  const Component =
    subType && subtypeComponents[subType]
      ? subtypeComponents[subType]
      : null;

  // Stamped onto a plain, unstyled wrapper (no visual footprint of its
  // own) so `Navbar`'s scroll handler can read `data-nav-contrast` off
  // whatever section is currently sitting behind the fixed nav, without
  // every one of the ~30 subtype components above needing to apply this
  // attribute to their own root element individually.
  const navContrast = resolveNavContrast(entry.fields.navType);

  if (Component) {
    return (
      <div data-nav-contrast={navContrast}>
        <Component entry={entry} />
      </div>
    );
  }

  return (
    <div data-nav-contrast={navContrast} className="relative flex flex-col">
      {/* Default renderer */}
      <p>No renderer found for subtype: {subType}</p>
    </div>
  );
}