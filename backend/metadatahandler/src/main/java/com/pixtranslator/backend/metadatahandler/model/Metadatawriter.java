package com.pixtranslator.backend.metadatahandler.model;

import com.adobe.internal.xmp.XMPException;
import com.adobe.internal.xmp.XMPMeta;
import com.adobe.internal.xmp.XMPMetaFactory;
import com.adobe.internal.xmp.options.PropertyOptions;
import com.adobe.internal.xmp.options.SerializeOptions;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.imaging.ImageReadException;
import org.apache.commons.imaging.ImageWriteException;
import org.apache.commons.imaging.Imaging;
import org.apache.commons.imaging.common.ImageMetadata;
import org.apache.commons.imaging.formats.jpeg.JpegImageMetadata;
import org.apache.commons.imaging.formats.jpeg.JpegPhotoshopMetadata;
import org.apache.commons.imaging.formats.jpeg.exif.ExifRewriter;
import org.apache.commons.imaging.formats.jpeg.iptc.IptcRecord;
import org.apache.commons.imaging.formats.jpeg.iptc.IptcTypes;
import org.apache.commons.imaging.formats.jpeg.iptc.JpegIptcRewriter;
import org.apache.commons.imaging.formats.jpeg.iptc.PhotoshopApp13Data;
import org.apache.commons.imaging.formats.jpeg.xmp.JpegXmpRewriter;
import org.apache.commons.imaging.formats.tiff.TiffImageMetadata;
import org.apache.commons.imaging.formats.tiff.constants.TiffTagConstants;
import org.apache.commons.imaging.formats.tiff.write.TiffOutputDirectory;
import org.apache.commons.imaging.formats.tiff.write.TiffOutputSet;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import static com.adobe.internal.xmp.XMPConst.NS_DC;

@Slf4j
public class Metadatawriter {

  public static void rewriteKeywords(File picture, String[] keywords)
          throws IOException, ImageReadException, ImageWriteException, XMPException {
    //XMP
    final File tempXmp = File.createTempFile("temp_xmp", ".jpg");
    try (FileOutputStream fos = new FileOutputStream(tempXmp);
         OutputStream os = new BufferedOutputStream(fos)) {
      final String xmpXmlString = Imaging.getXmpXml(picture);
      String newXmpXmlString = "";
      if (xmpXmlString != null && !xmpXmlString.isEmpty()) {
        XMPMeta picXmp = XMPMetaFactory.parseFromString(xmpXmlString);
        //delete old keywords array
        picXmp.deleteProperty(NS_DC, "dc:subject");
        //add each keyword one by one. Array recreation is done implicitly.
        for (String keyword : keywords) {
          picXmp.appendArrayItem(NS_DC,
                  "dc:subject",
                  new PropertyOptions().setArray(true),
                  keyword,
                  null);
        }
        newXmpXmlString = XMPMetaFactory.serializeToString(picXmp, new SerializeOptions());
      }
      if (!newXmpXmlString.isEmpty()) {
        new JpegXmpRewriter().updateXmpXml(picture, os, newXmpXmlString);
      }
    }
    //IPTC
    final File tempIptc = File.createTempFile("temp_iptc", ".jpg");
    ImageMetadata metadata = Imaging.getMetadata(tempXmp);
    JpegImageMetadata jpegMetadata = (JpegImageMetadata) metadata;
    try (FileOutputStream fos = new FileOutputStream(tempIptc);
         OutputStream os = new BufferedOutputStream(fos)) {
      if (null != jpegMetadata) {
        final JpegPhotoshopMetadata photoshopMetadata = jpegMetadata.getPhotoshop();
        List<IptcRecord> iptcRecordList = photoshopMetadata.photoshopApp13Data.getRecords();
        Collections.sort(iptcRecordList, IptcRecord.COMPARATOR);
        //remove old keywords
        Iterator<IptcRecord> iptcRecordIterator = iptcRecordList.iterator();
        while (iptcRecordIterator.hasNext()) {
          IptcRecord currentRecord = iptcRecordIterator.next();
          if (currentRecord.iptcType.equals(IptcTypes.KEYWORDS)) iptcRecordIterator.remove();
        }
        //insert new Keywords
        for (String keyword : keywords) {
          IptcRecord newRecordKeyword = new IptcRecord(IptcTypes.KEYWORDS, keyword);
          iptcRecordList.add(newRecordKeyword);
        }
        //sort entries to correct IPTC order
        Collections.sort(iptcRecordList, IptcRecord.COMPARATOR);
        //assemble in new App13 Block and write to file
        PhotoshopApp13Data newPhotoshopApp13Data = new PhotoshopApp13Data(iptcRecordList,
                photoshopMetadata.photoshopApp13Data.getNonIptcBlocks());
        new JpegIptcRewriter().writeIPTC(tempXmp, os, newPhotoshopApp13Data);
      }
    }
    //replace old file and cleanup
    Files.copy(tempIptc.toPath(), picture.toPath(), StandardCopyOption.REPLACE_EXISTING);
    tempXmp.delete();
    tempIptc.delete();
  }

  public static void rewriteCaption(final File picture, String caption)
          throws IOException, ImageReadException, ImageWriteException, XMPException {
    //EXIF
    final File tempExif = File.createTempFile("temp_exif", ".jpg");
    ImageMetadata metadata = Imaging.getMetadata(picture);
    JpegImageMetadata jpegMetadata = (JpegImageMetadata) metadata;
    try (FileOutputStream fos = new FileOutputStream(tempExif);
         OutputStream os = new BufferedOutputStream(fos)) {
      TiffOutputSet outputSet = null;
      TiffImageMetadata exif = null;
      //copy existing data from immutable TiffImageMetadata
      //to mutable TiffOutputSet
      if (null != jpegMetadata) {
        exif = jpegMetadata.getExif();
        if (null != exif) {
          outputSet = exif.getOutputSet();
        }
      }
      //create new Exif fields if none were present before
      if (null == outputSet) {
        outputSet = new TiffOutputSet();
      }
      final TiffOutputDirectory rootDirectory = outputSet.getOrCreateRootDirectory();
      // make sure to remove old value if present (this method will
      // not fail if the tag does not exist).
      //List<TiffOutputDirectory> allDirectories = outputSet.getDirectories();
      rootDirectory.removeField(TiffTagConstants.TIFF_TAG_IMAGE_DESCRIPTION);
      rootDirectory.add(TiffTagConstants.TIFF_TAG_IMAGE_DESCRIPTION, caption);
      new ExifRewriter().updateExifMetadataLossy(picture, os, outputSet);
    }
    //XMP
    final File tempXmp = File.createTempFile("temp_xmp", ".jpg");
    try (FileOutputStream fos = new FileOutputStream(tempXmp);
         OutputStream os = new BufferedOutputStream(fos)) {
      final String xmpXmlString = Imaging.getXmpXml(tempExif);
      String newXmpXmlString = "";
      if (xmpXmlString != null && !xmpXmlString.isEmpty()) {
        XMPMeta picXmp = XMPMetaFactory.parseFromString(xmpXmlString);
        picXmp.setLocalizedText(NS_DC,
                "dc:description",
                "",
                "x-default",
                caption);
        newXmpXmlString = XMPMetaFactory.serializeToString(picXmp, new SerializeOptions());
      }
      if (!newXmpXmlString.isEmpty()) {
        new JpegXmpRewriter().updateXmpXml(tempExif, os, newXmpXmlString);
      }
    }
    //IPTC
    final File tempIptc = File.createTempFile("temp_iptc", ".jpg");
    metadata = Imaging.getMetadata(tempXmp);
    jpegMetadata = (JpegImageMetadata) metadata;
    try (FileOutputStream fos = new FileOutputStream(tempIptc);
         OutputStream os = new BufferedOutputStream(fos)) {
      if (null != jpegMetadata) {
        IptcRecord iptcCaption = new IptcRecord(IptcTypes.CAPTION_ABSTRACT, caption);
        final JpegPhotoshopMetadata photoshopMetadata = jpegMetadata.getPhotoshop();
        List<IptcRecord> iptcRecordList = photoshopMetadata.photoshopApp13Data.getRecords();
        IptcRecord[] iptcData = iptcRecordList.toArray(IptcRecord[]::new);
        for (int i = 0; i < iptcData.length; i++) {
          if (iptcData[i].iptcType.equals(IptcTypes.CAPTION_ABSTRACT)) {
            iptcData[i] = iptcCaption;
            break;
          }
        }
        PhotoshopApp13Data newPhotoshopApp13Data = new PhotoshopApp13Data(Arrays.asList(iptcData),
                photoshopMetadata.photoshopApp13Data.getNonIptcBlocks());
        new JpegIptcRewriter().writeIPTC(tempXmp, os, newPhotoshopApp13Data);
      }
    }
    Files.copy(tempIptc.toPath(), picture.toPath(), StandardCopyOption.REPLACE_EXISTING);
    tempExif.delete();
    tempXmp.delete();
    tempIptc.delete();
  }

  public static void rewriteKeywordsAndCaption(File picture, String[] keywords, String caption)
          throws ImageWriteException, ImageReadException, IOException, XMPException {
    rewriteKeywords(picture, keywords);
    rewriteCaption(picture, caption);
  }

}
