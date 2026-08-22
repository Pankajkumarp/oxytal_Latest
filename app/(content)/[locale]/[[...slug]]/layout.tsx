
type LayoutParams = {
  locale: string;
  slug?: string[];
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<LayoutParams>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}>): Promise<React.ReactElement<any>> {
  const { locale } = await params;

  return (
    <>
      {children}
    </>
  );
}
