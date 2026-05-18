import { ReactComponent as AnimatedLogo } from '../../assets/images/logo_animato_corretto.svg';

export const Spinner = ({ className, style, size = 32, stopped = false }) => {
  return (
    <AnimatedLogo
      className={className}
      style={{ width: size, height: size, animationPlayState: stopped ? 'paused' : 'running', ...style }}
    />
  );
};
