import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { StyleSheet } from "react-native";

export default function TestScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#000000ff"
          name="folder.circle.fill"
          style={styles.headerImage}
        />
      }
    >
      <ThemedText type="title">Test</ThemedText>
      <ThemedText style={styles.text} numberOfLines={5}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolore illum
        omnis ipsam corrupti magni, quam possimus accusantium voluptatem soluta
        ratione amet necessitatibus iure consectetur deleniti illo suscipit.
        Dolorem, blanditiis hic. Nostrum, tempora inventore similique, ut
        dignissimos esse eum rerum, maiores saepe cupiditate facere asperiores
        ipsa ad? Saepe ea repellendus sint asperiores quod, non corrupti
        doloribus suscipit magnam repudiandae, culpa consequatur! Natus ullam
        deleniti officiis iusto sed quas nulla laudantium a, suscipit qui
        deserunt amet quaerat, hic dolores. Quod sed vitae placeat dolore
        temporibus ad quidem! Autem vitae beatae perspiciatis omnis. Asperiores,
        facere. Voluptates, eos quo veniam ut dolor, minima, reprehenderit
        recusandae sunt accusantium cum corporis excepturi dolorem rerum
        molestiae magnam quod? Placeat asperiores ad rem sit ducimus dolores
        maiores vitae? Ea enim, eos tenetur quis dolore ipsam fugiat rem in
        tempore ab quos iste! Unde provident dolorem voluptate quia. Eos, itaque
        dolore eligendi tenetur voluptates ea et numquam ipsum eum?
      </ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "#00a6ffff",
    textAlign: "auto",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});
