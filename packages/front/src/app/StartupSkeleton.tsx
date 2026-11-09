export const StartupSkeleton = () => (
  <div role='status' className='vkap_startup' aria-label='Загрузка плеера' aria-busy='true'>
    <div className='vkap_startup_player'><i /><i /><i /></div>
    <div className='vkap_startup_nav'><i /><i /><i /><i /></div>
    <div className='vkap_startup_search' />
    <div className='vkap_startup_tracks'>{Array.from({ length: 6 }, (_, index) => <div key={index}><i /><span><i /><i /></span></div>)}</div>
    <div className='vkap_startup_covers'>{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
  </div>
)
