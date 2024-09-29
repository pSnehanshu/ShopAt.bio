import clsx from "clsx";
import type { LoaderData } from "./route";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export function ProductPhotosSlider({
  photos,
  className,
  mainPhotoUrl,
  productName,
}: {
  photos: LoaderData["product"]["photos"];
  className?: string;
  mainPhotoUrl: string;
  productName: string;
}) {
  return (
    <div className={clsx(className, "select-none")}>
      {photos.length > 0 ? (
        <Swiper
          modules={[Navigation, Pagination, Keyboard]}
          loop
          keyboard
          navigation
          pagination
          scrollbar={{ draggable: true }}
        >
          {photos.map((photo) => (
            <SwiperSlide key={photo.id}>
              <img
                src={photo.url}
                alt={photo.caption ?? ""}
                className="w-full h-96 object-contain"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <img
          src={mainPhotoUrl}
          alt={productName}
          className="w-full h-96 object-contain"
        />
      )}
    </div>
  );
}
