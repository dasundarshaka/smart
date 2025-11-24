const GridBackground = ({ children }) => {
	return (
		<div className=' w-full bg-black text-white bg-grid-small-white/[0.1] relative'>
			<div className='absolute pointer-events-none inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]'></div>
			{children}
		</div>
	);
};
export default GridBackground;