
import React from 'react';
import { Star, MapPin, Clock, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { motion } from 'framer-motion';

interface SalonService {
  name: string;
  price: number;
  duration: number;
}

interface SalonCardProps {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  distance: string;
  image: string;
  services: SalonService[];
  openingTime: string;
  closingTime: string;
  featured?: boolean;
  type: 'men' | 'women' | 'unisex';
  className?: string;
}

const SalonCard: React.FC<SalonCardProps> = ({
  id,
  name,
  rating,
  reviewCount,
  address,
  distance,
  image,
  services,
  openingTime,
  closingTime,
  featured = false,
  type,
  className,
}) => {
  const typeColors = {
    men: 'bg-salon-men text-white dark:bg-salon-men-light',
    women: 'bg-salon-women text-white dark:bg-salon-women-light',
    unisex: 'bg-gradient-to-r from-salon-men to-salon-women text-white',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "glass-card overflow-hidden transition-all duration-300",
        featured ? 'border-2 border-primary dark:border-primary' : 'border border-border',
        className
      )}
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
        {featured && (
          <div className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-md">
            Featured
          </div>
        )}
        <div className={cn(
          "absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-md",
          typeColors[type]
        )}>
          {type === 'men' ? 'Men' : type === 'women' ? 'Women' : 'Unisex'}
        </div>
        <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white dark:hover:bg-dark-card">
          <Heart className="w-4 h-4 text-salon-women dark:text-salon-women-light" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-salon-men dark:fill-salon-men-light text-salon-men dark:text-salon-men-light mr-1" />
            <span>{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            <span className="text-muted-foreground text-xs ml-1">({reviewCount})</span>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{address}</span>
          <span className="ml-1 text-xs">({distance})</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4 mr-1" />
          <span>{openingTime} - {closingTime}</span>
        </div>
        
        <div className="space-y-2 mb-4">
          {services.slice(0, 3).map((service, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{service.name}</span>
              <div className="flex items-center">
                <span className="font-medium">${service.price}</span>
                <span className="text-xs ml-2 text-muted-foreground">{service.duration} min</span>
              </div>
            </div>
          ))}
          {services.length > 3 && (
            <div className="text-sm text-center text-muted-foreground">
              +{services.length - 3} more services
            </div>
          )}
        </div>
        
        <Link to={`/book/${id}`}>
          <AnimatedButton 
            variant={type === 'men' ? 'men' : 'women'} 
            className="w-full" 
            anim="shine"
          >
            Book Now
          </AnimatedButton>
        </Link>
      </div>
    </motion.div>
  );
};

export default SalonCard;
