/** FREED brand tokens — shared by every screen. */
export const colors = {
  pink: '#FFAEB3',
  pinkSoft: '#FFE1E3',
  green: '#7BC96F',
  greenMid: '#B0E1A2',
  greenLight: '#CBF5AF',
  cream: '#FAFFD8',
  bg: '#FFFEFA',
  surface: '#FFFFFF',
  ink: '#26312B',
  ink2: '#5E6B62',
  ink3: '#8A968D',
  line: '#EFEAE0',
  avail: '#3FA34D',
  danger: '#E5686E',
};

export const radius = { sm: 12, md: 18, lg: 26, pill: 999 };
export const space = (n: number) => n * 4;

export const font = {
  display: 'Unbounded_600SemiBold', // loaded via expo-font
  body: 'Inter_450Regular',
  bodyBold: 'Inter_600SemiBold',
};

export const shadow = {
  card: {
    shadowColor: '#26312B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
