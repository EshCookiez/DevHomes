import ProjectsPage from '@/app/projects/page'

export default async function ProjectsByLocationPage(props: {
  params: Promise<{ location: string }>
  searchParams?: Promise<{ q?: string; location?: string; status?: string; type?: string; beds?: string; baths?: string; priceMin?: string; priceMax?: string; areaMin?: string; areaMax?: string; keywords?: string; agent?: string; tourTypes?: string; contract?: string; view?: string; sort?: string; __scoped?: string }>
}) {
  const { location } = await props.params
  const searchParams = (await props.searchParams) ?? {}

  return <ProjectsPage searchParams={Promise.resolve({ ...searchParams, location, __scoped: '1' })} />
}
