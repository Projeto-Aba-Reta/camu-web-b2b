import Script from "next/script";

type Props = {
  websiteId: string;
};

/** Widget de chat da Crisp. `websiteId` vem de NEXT_PUBLIC_CRISP_WEBSITE_ID —
 *  sem essa env, o componente não é renderizado (ver layout.tsx). */
export default function CrispChat({ websiteId }: Props) {
  return (
    <Script id="crisp-chat" strategy="afterInteractive">
      {`window.$crisp=[];window.CRISP_WEBSITE_ID=${JSON.stringify(websiteId)};[["chat:opened","opened"],["chat:closed","closed"],["message:sent","message_sent"]].forEach(function(e){window.$crisp.push(["on",e[0],function(){window.dispatchEvent(new CustomEvent("camu:chat",{detail:e[1]}))}])});(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
    </Script>
  );
}
