import ProjectDetailPage from '@/app/projects/[slug]/page'

export default async function ProjectDetailByLocationPage(props: {
  params: Promise<{ location: string; slug: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { slug } = await props.params
  const searchParams = await props.searchParams

  return (
    <ProjectDetailPage
      params={Promise.resolve({ slug })}
      searchParams={Promise.resolve(searchParams)}
    />
  )
}
