const Logo = ({ className = "h-auto w-auto max-h-16" }: { className?: string }) => {
  return (
    <img
      src="https://res.cloudinary.com/de88x1rlt/image/upload/v1776170249/bcos/general/BCOS-Main-Logo_nb1k5m.webp"
      alt="BCOS Logo"
      className={className}
    />
  );
};

export default Logo;
