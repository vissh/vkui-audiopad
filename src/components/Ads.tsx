import { FixedLayout, PromoBanner } from "@vkontakte/vkui";
import { FC, useEffect } from "react";

export const Ads: FC = () => {

    const promoBannerProps = {
        title: "VK Combo",
        domain: "vkcombo.ru",
        trackingLink: "https://vkcombo.ru/",
        ctaText: "Больше о подписке",
        advertisingLabel: "Реклама",
        iconLink: "https://sun1-23.userapi.com/impf/Np59vefe-IvrSqUPWJzrzRWIZxdWa4VEbj451w/3CLEqM2MCtg.jpg?size=75x75&quality=90&sign=3d559246db7ed199a17f1f5fff50243e",
        description: "VK Combo — это музыка без рекламы, онлайн-кинотеатр и скидки на книги, образование и игры в облаке",
        statistics: [],
    };

    useEffect(() => {

    }, []);

    return (
        <FixedLayout vertical="bottom">
            <PromoBanner bannerData={promoBannerProps} onClose={() => { }} />
        </FixedLayout>
    );
};
