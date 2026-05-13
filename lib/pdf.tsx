/* eslint-disable react/no-unknown-property */
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Duration } from './types';

export type PdfProposal = {
  title: string;
  clientName: string;
  clientEmail: string;
  companyName: string | null;
  description: string;
  deliverables: string[];
  includedServices: string[];
  excludedServices: string[];
  oneTimePrice: number | null;
  monthlyFee: number | null;
  duration: Duration;
  timeline: string | null;
};
export type PdfAcceptance = {
  acceptedAt: Date;
  typedSignature: string;
  acceptedTermsVersion: string;
  acceptedTermsHash: string;
  ipAddress: string;
};

const COLOR = {
  navy: '#0C1A3A',
  navyMid: '#162448',
  orange: '#C4561A',
  orangePale: '#F4A56A',
  cream: '#F5F0E8',
  mute: '#9DA7BC',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLOR.navy,
    color: COLOR.cream,
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
  },
  // header bar
  header: {
    backgroundColor: COLOR.navy,
    padding: 32,
    borderBottom: `1pt solid ${COLOR.orange}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 18, height: 18, backgroundColor: COLOR.orange,
    color: COLOR.navy, fontFamily: 'Times-Bold', fontSize: 12,
    textAlign: 'center', paddingTop: 2, marginRight: 8,
  },
  brandText: { fontFamily: 'Times-Bold', fontSize: 14, color: COLOR.cream },
  brandTextAccent: { color: COLOR.orange },
  headerLabel: { fontSize: 8, color: COLOR.orangePale, letterSpacing: 2 },

  body: { padding: 32, paddingTop: 28 },
  label: { fontSize: 7, letterSpacing: 2, color: COLOR.orange, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  h1: { fontFamily: 'Times-Bold', fontSize: 26, color: COLOR.cream, marginBottom: 6, lineHeight: 1.1 },
  h1Italic: { fontFamily: 'Times-Italic', color: COLOR.orange },
  sub: { color: COLOR.mute, fontSize: 10, lineHeight: 1.6, marginBottom: 18 },

  metaRow: { flexDirection: 'row', marginBottom: 18, borderTop: `1pt solid #1E3260`, borderBottom: `1pt solid #1E3260`, paddingVertical: 10 },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 7, color: COLOR.mute, letterSpacing: 2, marginBottom: 3, fontFamily: 'Helvetica-Bold' },
  metaValue: { fontSize: 10, color: COLOR.cream },

  sectionTitle: {
    fontSize: 7, letterSpacing: 2, color: COLOR.orange,
    fontFamily: 'Helvetica-Bold', marginTop: 18, marginBottom: 8,
  },
  desc: { fontSize: 11, lineHeight: 1.6, color: COLOR.cream },

  pricingBox: {
    backgroundColor: COLOR.navyMid,
    borderLeft: `2pt solid ${COLOR.orange}`,
    padding: 18, marginTop: 14, marginBottom: 4,
    flexDirection: 'row', gap: 24,
  },
  pricingCol: { flex: 1 },
  pricingNum: { fontFamily: 'Times-Bold', fontSize: 26, color: COLOR.cream, marginBottom: 2 },
  pricingLabel: { fontSize: 8, color: COLOR.mute, letterSpacing: 2 },

  list: { marginTop: 6 },
  listItem: { flexDirection: 'row', marginBottom: 5, fontSize: 10 },
  bullet: { color: COLOR.orangePale, width: 12 },
  bulletEx: { color: COLOR.mute, width: 12 },
  listText: { flex: 1, color: COLOR.cream, lineHeight: 1.5 },
  listTextEx: { flex: 1, color: COLOR.mute, lineHeight: 1.5, textDecoration: 'line-through' },

  signature: {
    marginTop: 24, padding: 16, backgroundColor: COLOR.navyMid,
    border: `1pt solid ${COLOR.orange}`,
  },
  sigName: { fontFamily: 'Times-Italic', fontSize: 22, color: COLOR.cream, marginBottom: 4 },
  sigMeta: { fontSize: 8, color: COLOR.mute, lineHeight: 1.5 },

  footer: {
    position: 'absolute', bottom: 16, left: 32, right: 32,
    flexDirection: 'row', justifyContent: 'space-between',
    color: COLOR.mute, fontSize: 7, letterSpacing: 2,
    borderTop: `1pt solid #1E3260`, paddingTop: 8,
  },
});

const durationLabel = (d: Duration): string => ({
  ONE_TIME: 'One-time engagement',
  MONTHS_3: '3 months',
  MONTHS_6: '6 months',
  MONTHS_12: '12 months',
})[d];

const fmtEUR = (v: number | null) =>
  v == null ? '—' : `€${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(v)}`;

export function ProposalPdf({ proposal, acceptance }: { proposal: PdfProposal; acceptance: PdfAcceptance }) {
  return (
    <Document
      title={`Proposal — ${proposal.title}`}
      author="MadHat Works"
      creator="MadHat Proposals"
      producer="MadHat Proposals"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>M</Text>
            <Text style={styles.brandText}>
              Mad<Text style={styles.brandTextAccent}>Hat</Text>
            </Text>
          </View>
          <Text style={styles.headerLabel}>PROPOSAL · ACCEPTED</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>—  PROPOSAL</Text>
          <Text style={styles.h1}>
            {proposal.title.split(' ').slice(0, -1).join(' ')}{' '}
            <Text style={styles.h1Italic}>{proposal.title.split(' ').slice(-1).join(' ')}</Text>
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>CLIENT</Text>
              <Text style={styles.metaValue}>{proposal.clientName}</Text>
              {proposal.companyName ? <Text style={[styles.metaValue, { color: COLOR.mute }]}>{proposal.companyName}</Text> : null}
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>CONTACT</Text>
              <Text style={styles.metaValue}>{proposal.clientEmail}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>DURATION</Text>
              <Text style={styles.metaValue}>{durationLabel(proposal.duration)}</Text>
            </View>
            {proposal.timeline ? (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>TIMELINE</Text>
                <Text style={styles.metaValue}>{proposal.timeline}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>—  OVERVIEW</Text>
          <Text style={styles.desc}>{proposal.description}</Text>

          {(proposal.oneTimePrice != null || proposal.monthlyFee != null) && (
            <View style={styles.pricingBox}>
              {proposal.oneTimePrice != null && (
                <View style={styles.pricingCol}>
                  <Text style={styles.pricingNum}>{fmtEUR(proposal.oneTimePrice)}</Text>
                  <Text style={styles.pricingLabel}>ONE-TIME SETUP</Text>
                </View>
              )}
              {proposal.monthlyFee != null && (
                <View style={styles.pricingCol}>
                  <Text style={styles.pricingNum}>{fmtEUR(proposal.monthlyFee)}<Text style={{ fontSize: 11, color: COLOR.mute }}> /month</Text></Text>
                  <Text style={styles.pricingLabel}>RECURRING</Text>
                </View>
              )}
            </View>
          )}

          {proposal.deliverables.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>—  DELIVERABLES</Text>
              <View style={styles.list}>
                {proposal.deliverables.map((d, i) => (
                  <View key={i} style={styles.listItem}><Text style={styles.bullet}>→</Text><Text style={styles.listText}>{d}</Text></View>
                ))}
              </View>
            </>
          )}

          {proposal.includedServices.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>—  INCLUDED SERVICES</Text>
              <View style={styles.list}>
                {proposal.includedServices.map((d, i) => (
                  <View key={i} style={styles.listItem}><Text style={styles.bullet}>→</Text><Text style={styles.listText}>{d}</Text></View>
                ))}
              </View>
            </>
          )}

          {proposal.excludedServices.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>—  NOT INCLUDED</Text>
              <View style={styles.list}>
                {proposal.excludedServices.map((d, i) => (
                  <View key={i} style={styles.listItem}><Text style={styles.bulletEx}>×</Text><Text style={styles.listTextEx}>{d}</Text></View>
                ))}
              </View>
            </>
          )}

          <View style={styles.signature}>
            <Text style={styles.label}>—  DIGITAL ACCEPTANCE</Text>
            <Text style={styles.sigName}>{acceptance.typedSignature}</Text>
            <Text style={styles.sigMeta}>
              Accepted on {acceptance.acceptedAt.toUTCString()}{'\n'}
              Terms version: {acceptance.acceptedTermsVersion}{'\n'}
              Evidence hash: {acceptance.acceptedTermsHash}{'\n'}
              IP: {acceptance.ipAddress}
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>MADHAT WORKS · PROPOSAL</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
