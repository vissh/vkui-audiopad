import { Footnote, Headline } from '@vkontakte/vkui'
import { LoadingPlaceholder as Skeleton } from '@/shared/ui/loading-placeholder'
import './TrackSkeleton.css'

export const TrackSkeleton = () => (
  <div className='vkap_track_skeleton'>
    <div className='vkap_track_skeleton_cover'><Skeleton width={48} height={48} /></div>
    <div className='vkap_track_skeleton_text'>
      <Headline Component='div' weight='3'><Skeleton width={120} /></Headline>
      <Footnote Component='div'><Skeleton width={75} /></Footnote>
    </div>
    <div className='vkap_track_skeleton_duration'><Skeleton width={30} /></div>
  </div>
)
